const User = require('../models/User');
const Class = require('../models/Class');
const Course = require('../models/Course');
const PracticeSession = require('../models/PracticeSession');

// @desc    Get admin dashboard stats
// @route   GET /api/v1/dashboard/admin
// @access  Private/Admin
const getAdminDashboard = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalClasses = await Class.countDocuments();
    const totalCourses = await Course.countDocuments();
    const upcomingPractices = await PracticeSession.find({
      $or: [
        { startDate: { $gte: new Date() } },
        { recurring: true },
      ],
    })
      .sort({ startDate: 1, startTime: 1 })
      .limit(5)
      .populate('class', 'name');

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
    // Teacher's assignments count, upcoming supervised practices, etc.
    const TeacherAssignment = require('../models/TeacherAssignment');
    const assignments = await TeacherAssignment.find({ teacher: req.user.id }).populate('class course');
    const practiceCount = await PracticeSession.countDocuments({ supervisor: req.user.id, startDate: { $gte: new Date() } });

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
    // Return basic profile, class, upcoming practices
    const practices = await PracticeSession.find({
      $or: [
        { assignedStudents: req.user.id },
        { class: req.user.class, assignedStudents: { $size: 0 } },
      ],
    })
      .sort({ startDate: 1 })
      .limit(5)
      .populate('supervisor', 'fullName');
    const user = await User.findById(req.user.id).populate('class');
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