const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');
const compression = require('compression');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { protect } = require('./middleware/auth');

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const classRoutes = require('./routes/classRoutes');
const courseRoutes = require('./routes/courseRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const assessmentConfigRoutes = require('./routes/assessmentConfigRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const practiceRoutes = require('./routes/practiceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const fileRoutes = require('./routes/fileRoutes');
const churchClothRoutes = require('./routes/churchClothRoutes');
const developmentRoutes = require('./routes/developmentRoutes');

// Load environment variables
dotenv.config();

// Validate required environment variables
// Note: Using MONGO_URI to match your existing Render environment
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Connect to database with error handling
connectDB().catch(err => {
  console.error('ERROR: Database connection failed:', err.message);
  process.exit(1);
});

const app = express();

// Enable compression for all responses
app.use(compression());

// Trust proxy (needed for rate limiting behind reverse proxy like nginx/Vercel)
app.set('trust proxy', 1);

// Security headers with custom configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Stricter rate limiting for auth routes (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply stricter limiter to auth routes
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Apply general limiter to all other API routes
app.use('/api/', apiLimiter);

// CORS - allow multiple frontend origins
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : [
      'https://meskelebirihan.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173', // Vite default
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware for tracing
app.use((req, res, next) => {
  req.id = require('crypto').randomBytes(8).toString('hex');
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Structured JSON logging for production
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  };
  
  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = error.message;
    res.status(503).json(healthcheck);
  }
});

// Static files - uploads directory
// Note: In production, if you need to serve uploaded files publicly,
// remove the 'protect' middleware or use a CDN like Cloudinary/S3
if (process.env.NODE_ENV === 'production') {
  // Protected uploads (requires authentication)
  app.use('/uploads', protect, express.static(path.join(__dirname, 'uploads')));
} else {
  // Public uploads in development
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Mount API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/assessment-configs', assessmentConfigRoutes);
app.use('/api/v1/scores', scoreRoutes);
app.use('/api/v1/rankings', rankingRoutes);
app.use('/api/v1/practices', practiceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/church-cloth', churchClothRoutes);
app.use('/api/v1/development', developmentRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
============================================================
  Server running in ${process.env.NODE_ENV || 'development'} mode
  Listening on port ${PORT}
  Health check: http://localhost:${PORT}/health
============================================================
  `);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  
  server.close(async () => {
    console.log('[OK] HTTP server closed');
    
    // Close database connection
    try {
      await mongoose.connection.close();
      console.log('[OK] Database connection closed');
    } catch (err) {
      console.error('[ERROR] Error closing database connection:', err);
    }
    
    console.log('[OK] Process terminated');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('[WARNING] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[FATAL] UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[FATAL] UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});
