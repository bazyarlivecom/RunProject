const { spawn, exec } = require('child_process');
const path = require('path');
const { db } = require('../db/database');
const FileSystemUtils = require('../utils/fileSystem');

class ProjectController {
  constructor() {
    this.processes = {}; // Store running processes
  }

  /**
   * Validate project before creation/update
   */
  async validateProject(projectData) {
    const errors = [];
    const warnings = [];

    // Validate name
    if (!projectData.name || projectData.name.trim() === '') {
      errors.push('نام پروژه الزامی است - Project name is required');
    } else if (projectData.name.length > 100) {
      errors.push('نام پروژه بیش از حد طولانی است - Project name is too long');
    }

    // Validate path
    if (!projectData.path || projectData.path.trim() === '') {
      errors.push('مسیر پروژه الزامی است - Project path is required');
    } else {
      const pathVerification = await FileSystemUtils.verifyProjectPath(projectData.path);
      if (!pathVerification.valid) {
        errors.push(...pathVerification.errors);
      }
      if (pathVerification.warnings.length > 0) {
        warnings.push(...pathVerification.warnings);
      }
    }

    // Validate commands
    if (!projectData.startCommand || projectData.startCommand.trim() === '') {
      errors.push('دستور شروع الزامی است - Start command is required');
    } else {
      const cmdErrors = FileSystemUtils.validateCommand(projectData.startCommand);
      errors.push(...cmdErrors);
    }

    if (projectData.stopCommand && projectData.stopCommand.trim() !== '') {
      const cmdErrors = FileSystemUtils.validateCommand(projectData.stopCommand);
      errors.push(...cmdErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create project with validation
   */
  async createProject(projectData) {
    // Validate first
    const validation = await this.validateProject(projectData);
    if (!validation.valid) {
      const error = new Error('Validation failed');
      error.validation = validation;
      throw error;
    }

    // Get project type and suggestions
    const { projectType, suggestions } = await FileSystemUtils.getSuggestedCommands(projectData.path);
    
    // Get environment info
    const environment = await FileSystemUtils.getProjectEnvironment(projectData.path);

    const projectToAdd = {
      ...projectData,
      projectType: projectType.type,
      environmentInfo: JSON.stringify(environment)
    };

    return await db.addProject(projectToAdd);
  }

  /**
   * Start project with proper error handling
   */
  async startProject(projectId, io) {
    try {
      const project = await db.getProjectById(projectId);
      if (!project) {
        throw new Error('پروژه یافت نشد - Project not found');
      }

      if (this.processes[projectId]) {
        throw new Error('پروژه قبلاً در حال اجرا است - Project is already running');
      }

      // Verify path still exists
      const pathExists = await FileSystemUtils.pathExists(project.path);
      if (!pathExists) {
        throw new Error('مسیر پروژه یافت نشد - Project path no longer exists');
      }

      await db.addLog(projectId, `شروع پروژه... - Starting project: ${project.startCommand}`, 'info');

      return new Promise((resolve, reject) => {
        try {
          // Get environment variables
          const child = spawn('bash', ['-c', project.startCommand], {
            cwd: project.path,
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 30000 // 30 second timeout
          });

          this.processes[projectId] = child;

          // Store PID
          db.updateProject(projectId, { status: 'running', pid: child.pid, retryCount: 0 });

          // Handle stdout
          child.stdout.on('data', (data) => {
            const message = data.toString().trim();
            if (message) {
              db.addLog(projectId, message, 'stdout');
              io.emit('project:log', { projectId, message, type: 'stdout' });
            }
          });

          // Handle stderr
          child.stderr.on('data', (data) => {
            const message = data.toString().trim();
            if (message) {
              db.addLog(projectId, message, 'error');
              io.emit('project:log', { projectId, message, type: 'error' });
            }
          });

          // Handle process close
          child.on('close', (code) => {
            delete this.processes[projectId];
            const message = `فرایند به پایان رسید (کد خروج: ${code}) - Process exited with code ${code}`;
            db.addLog(projectId, message, 'info');
            db.updateProject(projectId, { status: 'stopped', pid: null });
            io.emit('project:status', { projectId, status: 'stopped', exitCode: code });
          });

          child.on('error', (err) => {
            delete this.processes[projectId];
            const message = `خطا: ${err.message} - Error: ${err.message}`;
            db.addLog(projectId, message, 'error');
            db.updateProject(projectId, { status: 'error', pid: null });
            io.emit('project:status', { projectId, status: 'error', error: err.message });
            reject(err);
          });

          const startMessage = `✓ پروژه شروع شد (PID: ${child.pid}) - Project started`;
          db.addLog(projectId, startMessage, 'success');
          io.emit('project:status', { projectId, status: 'running', pid: child.pid });
          resolve({ success: true, pid: child.pid });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      if (projectId) {
        await db.addLog(projectId, `خطا: ${error.message}`, 'error');
      }
      throw error;
    }
  }

  /**
   * Stop project safely
   */
  async stopProject(projectId, io) {
    try {
      const project = await db.getProjectById(projectId);
      if (!project) {
        throw new Error('پروژه یافت نشد - Project not found');
      }

      if (!this.processes[projectId] && !project.pid) {
        throw new Error('پروژه در حال اجرا نیست - Project is not running');
      }

      await db.addLog(projectId, 'تلاش برای متوقف کردن پروژه... - Stopping project...', 'info');

      if (project.stopCommand) {
        // Use custom stop command
        return new Promise((resolve, reject) => {
          exec(project.stopCommand, { cwd: project.path, timeout: 10000 }, (error, stdout, stderr) => {
            if (error) {
              // If custom stop fails, try killing the process
              if (this.processes[projectId]) {
                this.processes[projectId].kill('SIGTERM');
              } else if (project.pid) {
                try {
                  process.kill(project.pid, 'SIGTERM');
                } catch (e) {
                  console.error('خطا در کشتن فرایند - Error killing process:', e);
                }
              }
            }

            const message = 'پروژه متوقف شد - Project stopped';
            db.addLog(projectId, message, 'success');
            db.updateProject(projectId, { status: 'stopped', pid: null });
            delete this.processes[projectId];
            io.emit('project:status', { projectId, status: 'stopped' });
            resolve({ success: true });
          });
        });
      } else {
        // Kill the process directly
        if (this.processes[projectId]) {
          this.processes[projectId].kill('SIGTERM');
          delete this.processes[projectId];
        } else if (project.pid) {
          try {
            process.kill(project.pid, 'SIGTERM');
          } catch (e) {
            console.error('خطا در کشتن فرایند - Error killing process:', e);
          }
        }

        const message = 'پروژه متوقف شد - Project stopped';
        await db.addLog(projectId, message, 'success');
        await db.updateProject(projectId, { status: 'stopped', pid: null });
        io.emit('project:status', { projectId, status: 'stopped' });
        return { success: true };
      }
    } catch (error) {
      await db.addLog(projectId, `خطا: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Reset project (stop and clear logs)
   */
  async resetProject(projectId, io) {
    try {
      const project = await db.getProjectById(projectId);
      if (!project) {
        throw new Error('پروژه یافت نشد - Project not found');
      }

      // Stop if running
      if (project.status === 'running') {
        await this.stopProject(projectId, io);
      }

      // Clear recent logs but keep history
      await db.clearOldLogs(projectId, 0);

      const message = 'پروژه ریست شد - Project reset';
      await db.addLog(projectId, message, 'info');
      io.emit('project:status', { projectId, status: 'reset' });

      return { success: true };
    } catch (error) {
      await db.addLog(projectId, `خطا: ${error.message}`, 'error');
      throw error;
    }
  }
}

module.exports = new ProjectController();
