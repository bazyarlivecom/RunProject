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
  }
};

module.exports = { db: dbMethods, sqlite3 };
