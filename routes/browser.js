const express = require('express');
const router = express.Router();
const FileSystemUtils = require('../utils/fileSystem');
const path = require('path');
const os = require('os');

/**
 * Browse directory
 */
router.get('/browse', async (req, res) => {
  try {
    const dirPath = req.query.path || os.homedir();
    const maxDepth = req.query.depth ? parseInt(req.query.depth) : 2;

    const contents = await FileSystemUtils.browseDirectory(dirPath, {
      maxDepth,
      includeFiles: req.query.files !== 'false',
      includeDirs: req.query.dirs !== 'false',
      showHidden: req.query.hidden === 'true'
    });

    res.json({
      path: dirPath,
      contents,
      parent: dirPath !== '/' ? path.dirname(dirPath) : null
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get directory tree
 */
router.get('/tree', async (req, res) => {
  try {
    const dirPath = req.query.path || os.homedir();
    const depth = req.query.depth ? parseInt(req.query.depth) : 2;
    const maxItems = req.query.maxItems ? parseInt(req.query.maxItems) : 50;

    const tree = await FileSystemUtils.getDirectoryTree(dirPath, depth, maxItems);

    res.json({
      path: dirPath,
      tree
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Verify project path
 */
router.post('/verify', async (req, res) => {
  try {
    const { path: projectPath } = req.body;

    if (!projectPath) {
      return res.status(400).json({ error: 'مسیر الزامی است - Path is required' });
    }

    const verification = await FileSystemUtils.verifyProjectPath(projectPath);
    
    if (!verification.valid) {
      return res.status(400).json({
        error: 'مسیر نامعتبر است - Invalid path',
        ...verification
      });
    }

    // Get suggested commands
    const suggestions = await FileSystemUtils.getSuggestedCommands(projectPath);
    const environment = await FileSystemUtils.getProjectEnvironment(projectPath);

    res.json({
      valid: true,
      ...verification,
      suggestions,
      environment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get path information
 */
router.get('/info/:*', async (req, res) => {
  try {
    const filePath = '/' + req.params[0];
    const stats = await FileSystemUtils.getPathStats(filePath);

    if (!stats.accessible) {
      return res.status(404).json({ error: 'مسیر یافت نشد - Path not found' });
    }

    res.json({
      path: filePath,
      ...stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get common project paths
 */
router.get('/common-paths', (req, res) => {
  try {
    const homeDir = os.homedir();
    const commonPaths = [
      {
        name: 'صفحه اصلی - Home',
        path: homeDir,
        icon: 'home'
      },
      {
        name: 'Desktop',
        path: path.join(homeDir, 'Desktop'),
        icon: 'monitor'
      },
      {
        name: 'Documents',
        path: path.join(homeDir, 'Documents'),
        icon: 'file'
      },
      {
        name: 'Projects',
        path: path.join(homeDir, 'Projects'),
        icon: 'folder'
      },
      {
        name: 'Downloads',
        path: path.join(homeDir, 'Downloads'),
        icon: 'download'
      }
    ];

    if (process.platform === 'linux' || process.platform === 'darwin') {
      commonPaths.push({
        name: 'var/www',
        path: '/var/www',
        icon: 'server'
      });
    }

    res.json(commonPaths);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Detect project type
 */
router.post('/detect-type', async (req, res) => {
  try {
    const { path: projectPath } = req.body;

    if (!projectPath) {
      return res.status(400).json({ error: 'مسیر الزامی است - Path is required' });
    }

    const projectType = await FileSystemUtils.detectProjectType(projectPath);
    const suggestions = await FileSystemUtils.getSuggestedCommands(projectPath);

    res.json({
      projectType,
      suggestions
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get suggested commands for a path
 */
router.post('/suggestions', async (req, res) => {
  try {
    const { path: projectPath } = req.body;

    if (!projectPath) {
      return res.status(400).json({ error: 'مسیر الزامی است - Path is required' });
    }

    const suggestions = await FileSystemUtils.getSuggestedCommands(projectPath);

    res.json(suggestions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
