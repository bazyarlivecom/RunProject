const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/projects.db');

let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✓ متصل به پایگاه داده - Connected to database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Create projects table
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        path TEXT NOT NULL,
        description TEXT,
        startCommand TEXT NOT NULL,
        stopCommand TEXT,
        status TEXT DEFAULT 'stopped',
        pid INTEGER,
        projectType TEXT,
        environmentVariables TEXT,
        autoStart BOOLEAN DEFAULT 0,
        maxRetries INTEGER DEFAULT 0,
        retryCount INTEGER DEFAULT 0,
        healthCheckCommand TEXT,
        backupPath TEXT,
        tags TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        projectId INTEGER,
        message TEXT,
        type TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(projectId) REFERENCES projects(id)
      )
    `);

    // Create environment variables table
    db.run(`
      CREATE TABLE IF NOT EXISTS environment_variables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        projectId INTEGER,
        key TEXT NOT NULL,
        value TEXT,
        isSecret BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(projectId) REFERENCES projects(id),
        UNIQUE(projectId, key)
      )
    `);

    // Create project backups table
    db.run(`
      CREATE TABLE IF NOT EXISTS project_backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        projectId INTEGER,
        backupName TEXT,
        backupPath TEXT,
        backupSize INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(projectId) REFERENCES projects(id)
      )
    `);

    console.log('✓ جداول بیسی اطلاعات ایجاد شد - Database tables initialized');
  });
}

// Database methods
const dbMethods = {
  // Projects
  getAllProjects: function() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM projects', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },

  getProjectById: function(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  getProjectByName: function(name) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM projects WHERE name = ?', [name], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  addProject: function(project) {
    return new Promise((resolve, reject) => {
      const { name, path: projectPath, description, startCommand, stopCommand } = project;
      db.run(
        `INSERT INTO projects (name, path, description, startCommand, stopCommand) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, projectPath, description, startCommand, stopCommand || ''],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...project });
        }
      );
    });
  },

  updateProject: function(id, updates) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      
      db.run(
        `UPDATE projects SET ${fields}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, id],
        function(err) {
          if (err) reject(err);
          else resolve({ id, ...updates });
        }
      );
    });
  },

  deleteProject: function(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  },

  // Logs
  addLog: function(projectId, message, type = 'info') {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO logs (projectId, message, type) VALUES (?, ?, ?)',
        [projectId, message, type],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  getProjectLogs: function(projectId, limit = 100) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM logs WHERE projectId = ? ORDER BY timestamp DESC LIMIT ?',
        [projectId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  // Environment Variables
  setEnvironmentVariable: function(projectId, key, value, isSecret = false) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO environment_variables (projectId, key, value, isSecret) 
         VALUES (?, ?, ?, ?)`,
        [projectId, key, value, isSecret ? 1 : 0],
        function(err) {
          if (err) reject(err);
          else resolve({ projectId, key, value, isSecret });
        }
      );
    });
  },

  getEnvironmentVariables: function(projectId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM environment_variables WHERE projectId = ? ORDER BY key',
        [projectId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  deleteEnvironmentVariable: function(projectId, key) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM environment_variables WHERE projectId = ? AND key = ?',
        [projectId, key],
        function(err) {
          if (err) reject(err);
          else resolve({ success: true });
        }
      );
    });
  },

  // Backups
  addBackup: function(projectId, backupName, backupPath, backupSize) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO project_backups (projectId, backupName, backupPath, backupSize) 
         VALUES (?, ?, ?, ?)`,
        [projectId, backupName, backupPath, backupSize],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, projectId, backupName, backupPath, backupSize });
        }
      );
    });
  },

  getBackups: function(projectId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM project_backups WHERE projectId = ? ORDER BY createdAt DESC',
        [projectId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  deleteBackup: function(backupId) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM project_backups WHERE id = ?',
        [backupId],
        function(err) {
          if (err) reject(err);
          else resolve({ success: true });
        }
      );
    });
  },

  // Search and filter
  searchProjects: function(query) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM projects 
         WHERE name LIKE ? OR description LIKE ? OR path LIKE ? OR tags LIKE ?
         ORDER BY name`,
        [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  getRunningProjects: function() {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM projects WHERE status = "running"',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  },

  clearOldLogs: function(projectId, keepDays = 30) {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM logs 
         WHERE projectId = ? AND timestamp < datetime('now', '-' || ? || ' days')`,
        [projectId, keepDays],
        function(err) {
          if (err) reject(err);
          else resolve({ deletedCount: this.changes });
        }
      );
    });
  }
};

module.exports = { db: dbMethods, sqlite3 };
