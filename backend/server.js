const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

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
const attendanceRoutes = require('./routes/attendanceRoutes'); // added

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
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
app.use('/api/v1/attendance', attendanceRoutes); // added

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});