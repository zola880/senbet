const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { protect } = require('./middleware/auth');

// Load routes we actually have
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

dotenv.config();

connectDB();

const app = express();

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// CORS – allow Vercel frontend + localhost
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(o => o.trim())
  : [
      'https://senbet-yisj.vercel.app',   // your deployed frontend
      'http://localhost:3000',            // local development
    ];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (server-to-server, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parser
app.use(express.json());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files – protect uploads in production
if (process.env.NODE_ENV === 'production') {
  app.use('/uploads', protect, express.static(path.join(__dirname, 'uploads')));
} else {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Mount routes
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

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});