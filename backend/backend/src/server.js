const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { seedDefaultCategories } = require('./services/categoryService');

const PORT = process.env.PORT || 5000;

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
    // 1. Connect to Database
    await connectDB();

    // 2. Initialize default categories idempotently
    await seedDefaultCategories();

    // 3. Start Express HTTP Server
    server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` CampusCoin Backend Server Running on Port: ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Base API URL: http://localhost:${PORT}/api`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error(`[Startup Error] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
