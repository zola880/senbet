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

    // OPTIMIZATION: Added .lean() - read only, no updates
    const config = await AssessmentConfig.findOne({ class: classId }).lean();
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Assessment config not found for this class. Rankings cannot be computed.',
      });
    }

    // OPTIMIZATION: Specific field selection instead of excluding password
    // OPTIMIZATION: Added .lean() for plain objects (2-3x faster)
    const students = await User.find({ class: classId, role: 'student' })
      .select('fullName rollNumber class')
      .lean();

    if (students.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // OPTIMIZATION: Only populate course fields we need (name) for breakdown
    // OPTIMIZATION: Added .lean() for plain objects
    const assignments = await TeacherAssignment.find({ class: classId })
      .populate('course', 'name')
      .lean();

    // Unique courses - this logic is preserved
    const courseIds = [...new Set(assignments.map(a => a.course._id.toString()))];
    const courses = assignments
      .map(a => a.course)
      .filter((v, i, a) => a.findIndex(t => t._id.toString() === v._id.toString()) === i);

    // OPTIMIZATION: Added .lean() for plain objects (faster serialization)
    const scores = await StudentScore.find({
      class: classId,
      course: { $in: courseIds },
      student: { $in: students.map(s => s._id) },
    }).lean();

    // Compute ranking using helper - works with plain objects thanks to .lean()
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
    // OPTIMIZATION: Added .lean() - read only, just checking role and getting class
    const student = await User.findById(req.params.studentId)
      .select('fullName rollNumber role class')
      .lean();

    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const classId = student.class;
    if (!classId) {
      return res.status(400).json({ success: false, message: 'Student is not assigned to any class' });
    }

    // OPTIMIZATION: Added .lean()
    const config = await AssessmentConfig.findOne({ class: classId }).lean();
    if (!config) {
      return res.status(400).json({ success: false, message: 'Assessment config not found' });
    }

    // OPTIMIZATION: Specific fields + .lean()
    const allStudents = await User.find({ class: classId, role: 'student' })
      .select('fullName rollNumber class')
      .lean();

    // OPTIMIZATION: Limited populate + .lean()
    const assignments = await TeacherAssignment.find({ class: classId })
      .populate('course', 'name')
      .lean();

    const courseIds = [...new Set(assignments.map(a => a.course._id.toString()))];
    const courses = assignments
      .map(a => a.course)
      .filter((v, i, a) => a.findIndex(t => t._id.toString() === v._id.toString()) === i);

    // OPTIMIZATION: Added .lean()
    const scores = await StudentScore.find({
      class: classId,
      course: { $in: courseIds },
      student: { $in: allStudents.map(s => s._id) },
    }).lean();

    const fullRanking = computeRanking(allStudents, courses, config, scores);

    // Use string comparison since _id is now an ObjectId in plain object
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