const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    throw new Error('MONGO_URI environment variable is not defined.');
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // Throw (don't process.exit) — server.js's startup retry loop and the
    // Vercel serverless entry both rely on catching this failure to retry.
    throw error;
  }
};

/**
 * Disconnect from MongoDB database (for testing and graceful shutdown)
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed.');
  } catch (error) {
    console.error(`[MongoDB] Error closing connection: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
