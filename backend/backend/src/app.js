const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const importRoutes = require('./routes/importRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const goalRoutes = require('./routes/goalRoutes');
const reportRoutes = require('./routes/reportRoutes');
const insightRoutes = require('./routes/insightRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { sendSuccess } = require('./utils/apiResponse');

const app = express();

// Security HTTP headers — CSP tuned for the app's real assets:
// videos (CloudFront mp4 + Mux HLS via blob), images (Unsplash/Pexels), Google Fonts.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'img-src': [
          "'self'",
          'data:',
          'blob:',
          'https://images.unsplash.com',
          'https://images.pexels.com',
        ],
        'media-src': [
          "'self'",
          'blob:',
          'https://d8j0ntlcm91z4.cloudfront.net',
          'https://stream.mux.com',
          'https://*.mux.com',
        ],
        'connect-src': ["'self'", 'https://stream.mux.com', 'https://*.mux.com'],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      },
    },
  }),
);

// CORS configuration — env-configured origins + any localhost origin in non-production
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // curl / same-origin / server-to-server
    const configured = (process.env.CLIENT_URL || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (configured.includes(origin)) return callback(null, true);
    if (
      process.env.NODE_ENV !== 'production' &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  sendSuccess(res, 200, 'CampusCoin API is operational', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

const { getTips } = require('./controllers/insightController');
const { protect } = require('./middleware/authMiddleware');

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/import', importRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tips', protect, getTips);
app.use('/api/insights', insightRoutes);
app.use('/api/admin', adminRoutes);

// ── Production static hosting (single-origin deploy, e.g. alwaysdata) ──
// Serves the built React frontend (dist/) from the same Express process so the
// browser talks to one origin — no CORS setup needed for the API.
const distDir = path.resolve(__dirname, '../../../dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  // SPA fallback: any non-/api GET renders the React app (client-side routing).
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// 404 handler for undefined endpoints
app.use(notFound);

// Centralized error handling
app.use(errorHandler);

module.exports = app;
