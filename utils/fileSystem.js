const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

class FileSystemUtils {
  /**
   * Check if a path exists and is accessible
   */
  static async pathExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file statistics
   */
  static async getPathStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        accessible: true
      };
    } catch (error) {
      return {
        accessible: false,
        error: error.message
      };
    }
  }

  /**
   * Browse directory contents with filtering
   */
  static async browseDirectory(dirPath, options = {}) {
    const {
      maxDepth = 2,
      includeFiles = true,
      includeDirs = true,
      filter = null,
      showHidden = false
    } = options;

    try {
      if (!await this.pathExists(dirPath)) {
        throw new Error(`مسیر یافت نشد - Path not found: ${dirPath}`);
      }

      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        throw new Error(`مسیر یک پوشه نیست - Not a directory: ${dirPath}`);
      }

      return await this._browseDirRecursive(dirPath, maxDepth, {
        includeFiles,
        includeDirs,
        filter,
        showHidden
      });
    } catch (error) {
      throw new Error(`خطا در مرور پوشه - Error browsing directory: ${error.message}`);
    }
  }

  static async _browseDirRecursive(dirPath, depth, options, currentDepth = 0) {
    if (currentDepth > depth) return [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const items = [];

      for (const entry of entries) {
        if (!options.showHidden && entry.name.startsWith('.')) continue;

        const fullPath = path.join(dirPath, entry.name);
        const isDir = entry.isDirectory();

        if (isDir && options.includeDirs) {
          items.push({
            name: entry.name,
            path: fullPath,
            type: 'directory',
            depth: currentDepth
          });
        } else if (!isDir && options.includeFiles) {
          if (!options.filter || options.filter.includes(entry.name.split('.').pop())) {
            items.push({
              name: entry.name,
              path: fullPath,
              type: 'file',
              depth: currentDepth
            });
          }
        }
      }

      return items;
    } catch (error) {
      console.error(`خطا - Error reading directory ${dirPath}:`, error);
      return [];
    }
  }

  /**
   * Detect project type by checking common files
   */
  static async detectProjectType(projectPath) {
    try {
      const files = await fs.readdir(projectPath);

      if (files.includes('package.json')) {
        return { type: 'nodejs', name: 'Node.js' };
      }
      if (files.includes('requirements.txt') || files.includes('setup.py') || files.includes('Pipfile')) {
        return { type: 'python', name: 'Python' };
      }
      if (files.includes('Gemfile') || files.includes('config.ru')) {
        return { type: 'ruby', name: 'Ruby' };
      }
      if (files.includes('Dockerfile')) {
        return { type: 'docker', name: 'Docker' };
      }
      if (files.includes('.git')) {
        return { type: 'git', name: 'Git Repository' };
      }
      if (files.includes('manage.py')) {
        return { type: 'django', name: 'Django' };
      }
      if (files.includes('Makefile')) {
        return { type: 'make', name: 'Make Project' };
      }
      if (files.includes('go.mod')) {
        return { type: 'golang', name: 'Go' };
      }
      if (files.includes('cargo.toml')) {
        return { type: 'rust', name: 'Rust' };
      }

      return { type: 'unknown', name: 'Unknown Project' };
    } catch (error) {
      throw new Error(`خطا در تشخیص نوع پروژه - Error detecting project type: ${error.message}`);
    }
  }

  /**
   * Get suggested start commands based on project type
   */
  static async getSuggestedCommands(projectPath) {
    const projectType = await this.detectProjectType(projectPath);
    const suggestions = {
      nodejs: {
        startCommand: 'npm start',
        stopCommand: 'npm stop',
        alternates: ['node index.js', 'node server.js', 'node app.js', 'npm run dev']
      },
      python: {
        startCommand: 'python app.py',
        stopCommand: '',
        alternates: ['python main.py', 'python -m flask run', 'python manage.py runserver']
      },
      django: {
        startCommand: 'python manage.py runserver',
        stopCommand: '',
        alternates: []
      },
      ruby: {
        startCommand: 'bundle exec rails server',
        stopCommand: '',
        alternates: ['rails server', 'ruby app.rb']
      },
      docker: {
        startCommand: 'docker-compose up',
        stopCommand: 'docker-compose down',
        alternates: ['docker build -t myapp . && docker run myapp']
      },
      golang: {
        startCommand: 'go run main.go',
        stopCommand: '',
        alternates: ['go build && ./app']
      },
      rust: {
        startCommand: 'cargo run',
        stopCommand: '',
        alternates: []
      },
      unknown: {
        startCommand: '',
        stopCommand: '',
        alternates: []
      }
    };

    return {
      projectType,
      suggestions: suggestions[projectType.type] || suggestions.unknown
    };
  }

  /**
   * Verify project path is valid and accessible
   */
  static async verifyProjectPath(projectPath) {
    const result = {
      valid: false,
      errors: [],
      warnings: [],
      path: projectPath
    };

    try {
      // Check if path exists
      if (!await this.pathExists(projectPath)) {
        result.errors.push('مسیر یافت نشد - Path does not exist');
        return result;
      }

      // Check if it's a directory
      const stats = await this.getPathStats(projectPath);
      if (!stats.isDirectory) {
        result.errors.push('مسیر یک پوشه نیست - Path is not a directory');
        return result;
      }

      // Check if readable
      try {
        await fs.access(projectPath, fs.constants.R_OK);
      } catch {
        result.errors.push('مسیر قابل خواندگی نیست - Path is not readable');
        return result;
      }

      // Check common issues
      const files = await fs.readdir(projectPath);
      if (files.length === 0) {
        result.warnings.push('پوشه خالی است - Directory is empty');
      }

      // Check for common project files
      const projectType = await this.detectProjectType(projectPath);
      result.projectType = projectType;

      if (projectType.type === 'unknown') {
        result.warnings.push('نوع پروژه شناسایی نشد - Project type could not be detected');
      }

      result.valid = true;
      return result;
    } catch (error) {
      result.errors.push(`خطا - Error: ${error.message}`);
      return result;
    }
  }

  /**
   * Check if a command exists in the system
   */
  static commandExists(command) {
    try {
      const isWindows = process.platform === 'win32';
      const cmd = isWindows ? 'where' : 'which';
      execSync(`${cmd} ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate a command syntax
   */
  static validateCommand(command) {
    const errors = [];

    if (!command || command.trim() === '') {
      errors.push('دستور نمی تواند خالی باشد - Command cannot be empty');
      return errors;
    }

    // Check for dangerous commands
    const dangerousPatterns = ['rm -rf /', 'dd if=', ':(){ :|: & };:'];
    for (const pattern of dangerousPatterns) {
      if (command.includes(pattern)) {
        errors.push(`دستور خطرناک - Dangerous command detected: ${pattern}`);
      }
    }

    return errors;
  }

  /**
   * Get environment info for project
   */
  static async getProjectEnvironment(projectPath) {
    const env = {};

    try {
      // Check Node.js version if Node project
      if (await this.pathExists(path.join(projectPath, 'package.json'))) {
        try {
          const version = execSync('node --version').toString().trim();
          env.nodeVersion = version;
        } catch {
          env.nodeWarning = 'Node.js not installed';
        }

        try {
          const version = execSync('npm --version').toString().trim();
          env.npmVersion = version;
        } catch {
          env.npmWarning = 'npm not installed';
        }
      }

      // Check Python version if Python project
      if (await this.pathExists(path.join(projectPath, 'requirements.txt')) ||
          await this.pathExists(path.join(projectPath, 'setup.py'))) {
        try {
          const version = execSync('python --version').toString().trim();
          env.pythonVersion = version;
        } catch {
          try {
            const version = execSync('python3 --version').toString().trim();
            env.pythonVersion = version;
          } catch {
            env.pythonWarning = 'Python not installed';
          }
        }
      }
    } catch (error) {
      env.error = error.message;
    }

    return env;
  }

  /**
   * Get directory tree
   */
  static async getDirectoryTree(dirPath, depth = 2, maxItems = 50) {
    const tree = [];
    let itemCount = 0;

    const buildTree = async (currentPath, currentDepth, prefix = '') => {
      if (currentDepth > depth || itemCount >= maxItems) return;

      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          if (itemCount >= maxItems) break;
          if (entry.name.startsWith('.')) continue;

          const fullPath = path.join(currentPath, entry.name);
          itemCount++;

          if (entry.isDirectory()) {
            tree.push({
              name: entry.name,
              path: fullPath,
              type: 'directory',
              level: currentDepth
            });

            if (currentDepth < depth) {
              await buildTree(fullPath, currentDepth + 1, prefix + '  ');
            }
          } else {
            tree.push({
              name: entry.name,
              path: fullPath,
              type: 'file',
              level: currentDepth
            });
          }
        }
      } catch (error) {
        console.error(`خطا - Error reading ${currentPath}:`, error.message);
      }
    };

    await buildTree(dirPath, 0);
    return tree;
  }
}

module.exports = FileSystemUtils;
