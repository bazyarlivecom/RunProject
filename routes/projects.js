const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { db } = require('../db/database');

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await db.getAllProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific project
router.get('/:id', async (req, res) => {
  try {
    const project = await db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'پروژه یافت نشد - Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project logs
router.get('/:id/logs', async (req, res) => {
  try {
    const logs = await db.getProjectLogs(req.params.id);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { name, path, description, startCommand, stopCommand } = req.body;

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

    const project = await db.addProject({
      name,
      path,
      description,
      startCommand,
      stopCommand
    });

    await db.addLog(project.id, `پروژه ایجاد شد - Project created: ${name}`, 'info');

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { name, path, description, startCommand, stopCommand } = req.body;
    const project = await db.getProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'پروژه یافت نشد - Project not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (path !== undefined) updates.path = path;
    if (description !== undefined) updates.description = description;
    if (startCommand !== undefined) updates.startCommand = startCommand;
    if (stopCommand !== undefined) updates.stopCommand = stopCommand;

    const updated = await db.updateProject(req.params.id, updates);
    await db.addLog(req.params.id, `پروژه به روزرسانی شد - Project updated`, 'info');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project
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

// Start project
router.post('/:id/start', async (req, res) => {
  try {
    const result = await projectController.startProject(req.params.id, req.app.get('io'));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop project
router.post('/:id/stop', async (req, res) => {
  try {
    const result = await projectController.stopProject(req.params.id, req.app.get('io'));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset project
router.post('/:id/reset', async (req, res) => {
  try {
    const result = await projectController.resetProject(req.params.id, req.app.get('io'));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get running projects
router.get('/status/all', async (req, res) => {
  try {
    const running = projectController.getAllRunningProjects();
    const projects = await db.getAllProjects();
    
    const status = projects.map(p => ({
      ...p,
      isRunning: running.some(r => r.projectId == p.id)
    }));

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
