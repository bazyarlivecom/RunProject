const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { db } = require('../db/database');
const FileSystemUtils = require('../utils/fileSystem');

// ===== Project Management Routes =====

/**
 * Get all projects
 */
router.get('/', async (req, res) => {
  try {
    const projects = await db.getAllProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get specific project
 */
router.get('/:id', async (req, res) => {
  try {
    const project = await db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'پروژه یافت نشد - Project not found' });
    }

    // Get environment variables
    const envVars = await db.getEnvironmentVariables(req.params.id);
    
    res.json({
      ...project,
      environmentVariables: envVars
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get project logs
 */
router.get('/:id/logs', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const logs = await db.getProjectLogs(req.params.id, limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search projects
 */
router.get('/search/:query', async (req, res) => {
  try {
    const projects = await db.searchProjects(req.params.query);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create new project with validation
 */
router.post('/', async (req, res) => {
  try {
    const { name, path, description, startCommand, stopCommand, tags } = req.body;

    if (!name || !path || !startCommand) {
      return res.status(400).json({ 
        error: 'نام، مسیر و دستور شروع الزامی است - Name, path and start command are required' 
      });
    }

    // Check if project already exists
    const existing = await db.getProjectByName(name);
    if (existing) {
      return res.status(400).json({ error: 'این نام قبلاً استفاده شده است - This name already exists' });
    }

    // Create and validate project
    try {
      const project = await projectController.createProject({
        name,
        path,
        description,
        startCommand,
        stopCommand,
        tags: tags ? tags.join(',') : ''
      });

      await db.addLog(project.id, `پروژه ایجاد شد - Project created: ${name}`, 'info');

      res.status(201).json({
        ...project,
        createdSuccessfully: true
      });
    } catch (validationError) {
      if (validationError.validation) {
        return res.status(400).json({
          error: 'خطا در اعتبار سنجی - Validation failed',
          validation: validationError.validation
        });
      }
      throw validationError;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update project
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, path, description, startCommand, stopCommand, tags } = req.body;
    const project = await db.getProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'پروژه یافت نشد - Project not found' });
    }

    // Validate if path changed
    if (path && path !== project.path) {
      const pathVerification = await FileSystemUtils.verifyProjectPath(path);
      if (!pathVerification.valid) {
        return res.status(400).json({
          error: 'مسیر نامعتبر است - Invalid path',
          errors: pathVerification.errors
        });
      }
    }

    const updates = {};
    if (name !== undefined && name !== project.name) {
      const existing = await db.getProjectByName(name);
      if (existing && existing.id != req.params.id) {
        return res.status(400).json({ error: 'این نام قبلاً استفاده شده است - This name already exists' });
      }
      updates.name = name;
    }
    if (path !== undefined) updates.path = path;
    if (description !== undefined) updates.description = description;
    if (startCommand !== undefined) updates.startCommand = startCommand;
    if (stopCommand !== undefined) updates.stopCommand = stopCommand;
    if (tags !== undefined) updates.tags = tags ? tags.join(',') : '';

    const updated = await db.updateProject(req.params.id, updates);
    await db.addLog(req.params.id, `پروژه به روزرسانی شد - Project updated`, 'info');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete project
 */
router.delete('/:id', async (req, res) => {
  try {
    const project = await db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'پروژه یافت نشد - Project not found' });
    }

    // Stop if running
    if (project.status === 'running') {
      await projectController.stopProject(req.params.id, req.app.get('io'));
    }

    await db.deleteProject(req.params.id);
    await db.addLog(req.params.id, `پروژه حذف شد - Project deleted`, 'info');

    res.json({ success: true, message: 'پروژه حذف شد - Project deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start project
 */
router.post('/:id/start', async (req, res) => {
  try {
    const result = await projectController.startProject(req.params.id, req.app.get('io'));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stop project
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const result = await projectController.stopProject(req.params.id, req.app.get('io'));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reset project
 */
router.post('/:id/reset', async (req, res) => {
  try {
    const result = await projectController.resetProject(req.params.id, req.app.get('io'));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get running projects
 */
router.get('/status/running', async (req, res) => {
  try {
    const projects = await db.getRunningProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== Environment Variables Routes =====

/**
 * Get environment variables for project
 */
router.get('/:id/env', async (req, res) => {
  try {
    const project = await db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'پروژه یافت نشد - Project not found' });
    }

    const envVars = await db.getEnvironmentVariables(req.params.id);
    res.json(envVars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Set environment variable
 */
router.post('/:id/env', async (req, res) => {
  try {
    const { key, value, isSecret } = req.body;

    if (!key || key.trim() === '') {
      return res.status(400).json({ error: 'کلید متغیر الزامی است - Environment variable key is required' });
    }

    const project = await db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'پروژه یافت نشد - Project not found' });
    }

    const result = await db.setEnvironmentVariable(req.params.id, key, value || '', isSecret || false);
    await db.addLog(req.params.id, `متغیر محیطی اضافه شد - Environment variable added: ${key}`, 'info');

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete environment variable
 */
router.delete('/:id/env/:key', async (req, res) => {
  try {
    const project = await db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'پروژه یافت نشد - Project not found' });
    }

    await db.deleteEnvironmentVariable(req.params.id, req.params.key);
    await db.addLog(req.params.id, `متغیر محیطی حذف شد - Environment variable removed: ${req.params.key}`, 'info');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
