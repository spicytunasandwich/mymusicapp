const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const musicRoutes = require('./routes/music.routes');
const libraryRoutes = require('./routes/library.routes');
const userRoutes = require('./routes/user.routes');
const importRoutes = require('./routes/import.routes');

const path = require('path');

const app = express();

// Trust proxy for Render / Cloudflare HTTPS termination
app.enable('trust proxy');

// Security & Middlewares
// Allow cross-origin images so Cloudflare Pages and desktop can render uploads
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: '*', // Allow Web, Electron, and Android apps
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static assets with absolute directory paths
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Base API v1 Contract
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/music', musicRoutes);
app.use('/api/v1/library', libraryRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/import', importRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Audira Music Streaming Platform API',
    version: 'v1',
    docs: '/api/v1/health'
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
