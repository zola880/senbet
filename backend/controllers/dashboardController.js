const User = require('../models/User');
const Class = require('../models/Class');
const Course = require('../models/Course');
const PracticeSession = require('../models/PracticeSession');
const TeacherAssignment = require('../models/TeacherAssignment');

// @desc    Get admin dashboard stats
// @route   GET /api/v1/dashboard/admin
// @access  Private/Admin
const getAdminDashboard = async (req, res, next) => {
  try {
    // OPTIMIZATION: Run all independent queries in parallel with Promise.all()
    // OPTIMIZATION: countDocuments() already efficient (no .find().length) ✓
    // OPTIMIZATION: Added .lean() to practices query
    // OPTIMIZATION: Limited populate to only 'name' field
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalCourses,
      upcomingPractices,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Class.countDocuments(),
      Course.countDocuments(),
      PracticeSession.find({
        $or: [
          { startDate: { $gte: new Date() } },
          { recurring: true },
        ],
      })
        .select('title practiceType startDate startTime recurring dayOfWeek class')
        .sort({ startDate: 1, startTime: 1 })
        .limit(5)
        .populate('class', 'name')
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalCourses,
        upcomingPractices,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher dashboard stats
// @route   GET /api/v1/dashboard/teacher
// @access  Private/Teacher
const getTeacherDashboard = async (req, res, next) => {
  try {
    // OPTIMIZATION: Run both queries in parallel
    // OPTIMIZATION: Added .lean() to assignments
    // OPTIMIZATION: Limited populate to only needed fields
    const [assignments, practiceCount] = await Promise.all([
      TeacherAssignment.find({ teacher: req.user.id })
        .populate('class', 'name')
        .populate('course', 'name code')
        .lean(),
      PracticeSession.countDocuments({
        supervisor: req.user.id,
        startDate: { $gte: new Date() },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        assignmentsCount: assignments.length,
        assignments,
        upcomingPracticeCount: practiceCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student dashboard
// @route   GET /api/v1/dashboard/student
// @access  Private/Student
const getStudentDashboard = async (req, res, next) => {
  try {
    // OPTIMIZATION: Run both queries in parallel
    // OPTIMIZATION: Added .lean() to both queries
    // OPTIMIZATION: Limited populate to only needed fields
    // OPTIMIZATION: Added .select() to fetch only dashboard-relevant fields
    const [practices, user] = await Promise.all([
      PracticeSession.find({
        $or: [
          { assignedStudents: req.user.id },
          { class: req.user.class, assignedStudents: { $size: 0 } },
        ],
      })
        .select('title practiceType startDate startTime recurring dayOfWeek supervisor')
        .sort({ startDate: 1 })
        .limit(5)
        .populate('supervisor', 'fullName')
        .lean(),
      User.findById(req.user.id)
        .select('fullName email role rollNumber class')
        .populate('class', 'name')
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        upcomingPractices: practices,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getTeacherDashboard,
  getStudentDashboard,
};