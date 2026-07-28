const User = require('../models/User');
const AssessmentConfig = require('../models/AssessmentConfig');
const StudentScore = require('../models/StudentScore');
const TeacherAssignment = require('../models/TeacherAssignment');
const computeRanking = require('../utils/rankingHelper');

// @desc    Get ranking for a specific class
// @route   GET /api/v1/rankings/class/:classId
// @access  Private
const getClassRanking = async (req, res, next) => {
  try {
    const classId = req.params.classId;
    const config = await AssessmentConfig.findOne({ class: classId });
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Assessment config not found for this class. Rankings cannot be computed.',
      });
    }

    // Get all students in the class
    const students = await User.find({ class: classId, role: 'student' }).select('-password');
    if (students.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Get all courses assigned to this class (through TeacherAssignment)
    const assignments = await TeacherAssignment.find({ class: classId }).populate('course');
    // Unique courses
    const courseIds = [...new Set(assignments.map(a => a.course._id))];
    const courses = assignments.map(a => a.course).filter((v, i, a) => a.findIndex(t => t._id.equals(v._id)) === i);

    // Fetch all scores for these students, courses, class
    const scores = await StudentScore.find({
      class: classId,
      course: { $in: courseIds },
      student: { $in: students.map(s => s._id) },
    });

    // Compute ranking using helper
    const ranking = computeRanking(students, courses, config, scores);

    res.status(200).json({
      success: true,
      data: ranking, // sorted array with rank, student info, total, breakdown
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get ranking for a specific student (their position and details)
// @route   GET /api/v1/rankings/student/:studentId
// @access  Private (Student sees own, Admin/Teacher can see any)
const getStudentRanking = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const classId = student.class;
    if (!classId) {
      return res.status(400).json({ success: false, message: 'Student is not assigned to any class' });
    }

    const config = await AssessmentConfig.findOne({ class: classId });
    if (!config) {
      return res.status(400).json({ success: false, message: 'Assessment config not found' });
    }

    // Get all students in that class
    const allStudents = await User.find({ class: classId, role: 'student' }).select('-password');
    const assignments = await TeacherAssignment.find({ class: classId }).populate('course');
    const courseIds = [...new Set(assignments.map(a => a.course._id))];
    const courses = assignments.map(a => a.course).filter((v, i, a) => a.findIndex(t => t._id.equals(v._id)) === i);

    const scores = await StudentScore.find({
      class: classId,
      course: { $in: courseIds },
      student: { $in: allStudents.map(s => s._id) },
    });

    const fullRanking = computeRanking(allStudents, courses, config, scores);
    const studentRank = fullRanking.find(r => r.studentId.toString() === req.params.studentId);

    if (!studentRank) {
      return res.status(404).json({ success: false, message: 'No ranking data for this student' });
    }

    res.status(200).json({
      success: true,
      data: studentRank,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClassRanking,
  getStudentRanking,
};