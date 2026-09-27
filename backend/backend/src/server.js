const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { seedDefaultCategories } = require('./services/categoryService');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// ── Resilient startup (alwaysdata/PaaS friendly) ──
// The HTTP server must come up even if MongoDB is unreachable — otherwise the
// platform's reverse proxy answers 502 while we retry the DB in the background.
// Missing required env vars are still fatal (they indicate a config mistake).

// Validate critical environment configurations
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.error(
    `[Startup Error] Missing required environment variables: ${missingVars.join(', ')}`
  );
  process.exit(1);
}

let server;

const startServer = async () => {
  try {
    // 1. Start Express HTTP Server FIRST — API responses that need the DB will
    //    return 503 until the connection succeeds (app.js handles that state).
    server = app.listen(PORT, HOST, () => {
      console.log(`===============================================`);
      console.log(` CampusCoin Backend Server Running on Port: ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Base API URL: http://localhost:${PORT}/api`);
      console.log(`===============================================`);
    });

    // 2. Connect to Database with retry — the app stays up meanwhile.
    let dbConnected = false;
    for (let attempt = 1; attempt <= 30 && !dbConnected; attempt += 1) {
      try {
        await connectDB();
        dbConnected = true;
      } catch (error) {
        console.error(
          `[Startup] MongoDB not ready (attempt ${attempt}/30): ${error.message}`
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // 3. Initialize default categories idempotently (needs the DB).
    if (dbConnected) {
      try {
        await seedDefaultCategories();
      } catch (error) {
        console.error(`[Startup] Could not seed default categories: ${error.message}`);
      }
    } else {
      console.error('[Startup] Proceeding without MongoDB — API DB routes will return 503 until it connects.');
    }

    // 4. Keep retrying in the background forever so a late MongoDB service
    //    start still recovers without a manual restart.
    if (!dbConnected) {
      const retryLoop = async () => {
        while (!mongooseReady()) {
          try {
            await connectDB();
            await seedDefaultCategories();
            console.log('[Startup] MongoDB recovered — full API available.');
          } catch {
            await new Promise((resolve) => setTimeout(resolve, 15000));
          }
        }
      };
      retryLoop();
    }
  } catch (error) {
    console.error(`[Startup Error] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

function mongooseReady() {
  return require('mongoose').connection.readyState === 1;
}

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
    // Force-exit if connections do not drain in time (platform stop timeout).
    setTimeout(() => process.exit(0), 8000).unref();
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
