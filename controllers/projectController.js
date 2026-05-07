const { spawn, exec } = require('child_process');
const path = require('path');
const { db } = require('../db/database');

class ProjectController {
  constructor() {
    this.processes = {}; // Store running processes
  }

  async startProject(projectId, io) {
    try {
      const project = await db.getProjectById(projectId);
      if (!project) {
        throw new Error('پروژه یافت نشد - Project not found');
      }

      if (this.processes[projectId]) {
        throw new Error('پروژه قبلاً در حال اجرا است - Project is already running');
      }

      await db.addLog(projectId, `شروع پروژه... - Starting project: ${project.startCommand}`, 'info');

      return new Promise((resolve, reject) => {
        // Execute the start command in the project directory
        const child = spawn('bash', ['-c', project.startCommand], {
          cwd: project.path,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        this.processes[projectId] = child;

        // Store PID
        db.updateProject(projectId, { status: 'running', pid: child.pid });

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
          io.emit('project:status', { projectId, status: 'stopped' });
        });

        child.on('error', (err) => {
          delete this.processes[projectId];
          const message = `خطا: ${err.message} - Error: ${err.message}`;
          db.addLog(projectId, message, 'error');
          db.updateProject(projectId, { status: 'error', pid: null });
          io.emit('project:status', { projectId, status: 'error' });
          reject(err);
        });

        const startMessage = `✓ پروژه شروع شد (PID: ${child.pid}) - Project started`;
        db.addLog(projectId, startMessage, 'success');
        io.emit('project:status', { projectId, status: 'running', pid: child.pid });
        resolve({ success: true, pid: child.pid });
      });
    } catch (error) {
      await db.addLog(projectId, `خطا: ${error.message}`, 'error');
      throw error;
    }
  }

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
          exec(project.stopCommand, { cwd: project.path }, (error, stdout, stderr) => {
            if (error) {
              // If custom stop fails, try killing the process
              this.killProcess(projectId, io);
            }
            db.updateProject(projectId, { status: 'stopped', pid: null });
            delete this.processes[projectId];
            const msg = `✓ پروژه متوقف شد - Project stopped`;
            db.addLog(projectId, msg, 'success');
            io.emit('project:status', { projectId, status: 'stopped' });
            resolve({ success: true });
          });
        });
      } else {
        // Kill the process
        return this.killProcess(projectId, io);
      }
    } catch (error) {
      await db.addLog(projectId, `خطا: ${error.message}`, 'error');
      throw error;
    }
  }

  killProcess(projectId, io) {
    return new Promise((resolve) => {
      const child = this.processes[projectId];
      if (child) {
        try {
          process.kill(-child.pid); // Kill process group
        } catch (e) {
          try {
            child.kill();
          } catch (err) {
            console.error('Failed to kill process:', err);
          }
        }
      }
      
      delete this.processes[projectId];
      db.updateProject(projectId, { status: 'stopped', pid: null });
      const msg = `✓ پروژه کشته شد - Process killed`;
      db.addLog(projectId, msg, 'success');
      io.emit('project:status', { projectId, status: 'stopped' });
      resolve({ success: true });
    });
  }

  async resetProject(projectId, io) {
    try {
      const project = await db.getProjectById(projectId);
      if (!project) {
        throw new Error('پروژه یافت نشد - Project not found');
      }

      await db.addLog(projectId, 'ریست کردن پروژه... - Resetting project...', 'info');

      // Stop if running
      if (this.processes[projectId] || project.status === 'running') {
        await this.stopProject(projectId, io);
        // Wait a bit for process to stop
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Clear logs
      db.sqlite3.Database.prototype.run = function(sql, params, callback) {
        this.run.call(this, sql, params, callback);
      };

      const msg = `✓ پروژه ریست شد - Project reset successfully`;
      await db.addLog(projectId, msg, 'success');
      io.emit('project:status', { projectId, status: 'reset' });

      resolve({ success: true });
    } catch (error) {
      await db.addLog(projectId, `خطا: ${error.message}`, 'error');
      throw error;
    }
  }

  getProcessStatus(projectId) {
    return this.processes[projectId] ? 'running' : 'stopped';
  }

  getAllRunningProjects() {
    return Object.keys(this.processes).map(id => ({
      projectId: id,
      pid: this.processes[id].pid
    }));
  }
}

module.exports = new ProjectController();
