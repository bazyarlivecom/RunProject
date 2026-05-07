const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const projectRoutes = require('./routes/projects');
const projectsEnhanced = require('./routes/projects-enhanced');
const systemRoutes = require('./routes/system');
const browserRoutes = require('./routes/browser');

// Initialize database
const db = require('./db/database');

// API Routes
app.use('/api/projects', projectsEnhanced);
app.use('/api/browser', browserRoutes);
app.use('/api/system', systemRoutes);

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io globally accessible
app.set('io', io);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'سروری خطا رخ داده است', message: err.message });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 سرور بر روی پورت ${PORT} اجرا می شود - Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

module.exports = { app, io };
