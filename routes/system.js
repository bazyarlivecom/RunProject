const express = require('express');
const router = express.Router();
const os = require('os');
const { db } = require('../db/database');

// Get system info
router.get('/info', async (req, res) => {
  try {
    const projects = await db.getAllProjects();
    const runningCount = projects.filter(p => p.status === 'running').length;

    const info = {
      os: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      uptime: os.uptime(),
      projects: {
        total: projects.length,
        running: runningCount,
        stopped: projects.length - runningCount
      },
      timestamp: new Date()
    };

    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system stats
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      timestamp: new Date(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        percentUsed: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      loadAverage: os.loadavg(),
      cpus: os.cpus().length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
