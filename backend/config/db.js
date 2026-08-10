const mongoose = require('mongoose');

/**
 * MongoDB connection with optimized pooling for production.
 *
 * Note: Mongoose already uses a connection pool by default.
 * This configuration tunes the pool size and timeouts for
 * reliability under load instead of relying on defaults.
 */

// Pool size can be overridden via environment variable
const MAX_POOL_SIZE = parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) || 10;

const connectionOptions = {
  // --- Connection Pool Sizing ---
  maxPoolSize: MAX_POOL_SIZE,        // Max connections kept in the pool
  minPoolSize: 2,                    // Keep 2 warm connections ready

  // --- Timeouts (fail fast instead of hanging) ---
  serverSelectionTimeoutMS: 5000,    // 5s to find a healthy server
  socketTimeoutMS: 45000,            // Close sockets idle for 45s
  connectTimeoutMS: 10000,           // 10s for the initial connection

  // --- Idle Connection Cleanup ---
  maxIdleTimeMS: 30000,              // Drop connections idle for 30s

  // --- Network ---
  family: 4,                         // Force IPv4 (avoids slow IPv6 DNS lookups)

  // --- Retry Logic ---
  retryWrites: true,                 // Retry failed writes once on network error
  retryReads: true,                  // Retry failed reads once on network error
};

const connectDB = async () => {
  // Guard: ensure the URI exists before attempting to connect
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  // Monitor runtime connection events (useful for production debugging)
  mongoose.connection.on('error', (err) => {
    console.error(`Mongoose connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose disconnected from MongoDB');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('Mongoose reconnected to MongoDB');
  });

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    console.log(
      `MongoDB Connected: ${conn.connection.host} (pool size: ${MAX_POOL_SIZE})`
    );
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;