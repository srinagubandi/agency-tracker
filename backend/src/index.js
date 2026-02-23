/**
 * Agency Management App - Main Express Server
 *
 * This file bootstraps the Express application. It:
 *  - Loads environment variables from .env
 *  - Connects to PostgreSQL
 *  - Registers all middleware (CORS, JSON parsing, JWT auth, etc.)
 *  - Mounts all API route modules under /api/v1
 *  - Serves the React static build from /public
 *  - Serves uploaded images from the Railway Volume at /uploads
 *  - Starts listening on the PORT provided by Railway (or 3001 locally)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const fs = require('fs');

// Import database connection
const { pool } = require('./db/pool');

// Import Passport Google OAuth strategy configuration
require('./config/passport');

// Import route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const accountRoutes = require('./routes/accounts');
const websiteRoutes = require('./routes/websites');
const campaignRoutes = require('./routes/campaigns');
const timeEntryRoutes = require('./routes/timeEntries');
const changeLogRoutes = require('./routes/changeLog');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/uploads');
const settingsRoutes = require('./routes/settings');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
// Allow requests from the React dev server locally, and from the Railway domain
// in production. In production the frontend is served by this same Express
// process so CORS is mainly needed for local development.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true); // permissive for Railway deployment
  },
  credentials: true,
}));

// ─── BODY PARSING ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── PASSPORT INITIALISATION ─────────────────────────────────────────────────
// Passport is used only for the Google OAuth strategy. JWT is handled manually
// via our own middleware — we do NOT use passport-jwt.
app.use(passport.initialize());

// ─── STATIC FILES — UPLOADS (Railway Volume) ─────────────────────────────────
// Images uploaded by users (logos, avatars) are stored on a Railway Volume
// mounted at /app/uploads. We serve them as static files here.
const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');

// Ensure the uploads directory exists (important for local dev)
['agency', 'clients', 'avatars'].forEach(dir => {
  const fullPath = path.join(uploadsPath, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

app.use('/uploads', express.static(uploadsPath));

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/websites', websiteRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/time-entries', timeEntryRoutes);
app.use('/api/v1/change-log', changeLogRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/settings', settingsRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
// Health check endpoints (both paths for compatibility)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── STATIC FILES — REACT BUILD ───────────────────────────────────────────────
// In production, the React app is built into /backend/public. Express serves it
// here. Any route not matched by the API falls through to index.html so that
// React Router handles client-side navigation.
const publicPath = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  // Catch-all: serve React's index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'Agency Tracker API is running. Frontend build not found.' });
  });
}

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Agency Tracker API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
