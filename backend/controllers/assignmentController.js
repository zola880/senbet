const TeacherAssignment = require('../models/TeacherAssignment');

// @desc    Assign teacher to course & class
// @route   POST /api/v1/assignments
// @access  Private/Admin
const createAssignment = async (req, res, next) => {
  try {
    const assignment = await TeacherAssignment.create(req.body);
    // Populate references for response
    const populated = await TeacherAssignment.findById(assignment._id)
      .populate('teacher', 'fullName email')
      .populate('course', 'name')
      .populate('class', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all assignments (with filters)
// @route   GET /api/v1/assignments
// @access  Private
const getAssignments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.teacher) filter.teacher = req.query.teacher;
    if (req.query.class) filter.class = req.query.class;
    if (req.query.course) filter.course = req.query.course;

    const assignments = await TeacherAssignment.find(filter)
      .populate('teacher', 'fullName email')
      .populate('course', 'name')
      .populate('class', 'name');
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assignments for a specific teacher (useful for teacher dashboard)
// @route   GET /api/v1/assignments/teacher/:teacherId
// @access  Private (Teacher or Admin)
const getTeacherAssignments = async (req, res, next) => {
  try {
    const assignments = await TeacherAssignment.find({ teacher: req.params.teacherId })
      .populate('course', 'name')
      .populate('class', 'name');
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    next(error);
  }
};

// @desc    Update assignment
// @route   PUT /api/v1/assignments/:id
// @access  Private/Admin
const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await TeacherAssignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('teacher', 'fullName email')
      .populate('course', 'name')
      .populate('class', 'name');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete assignment
// @route   DELETE /api/v1/assignments/:id
// @access  Private/Admin
const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await TeacherAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.status(200).json({ success: true, message: 'Assignment removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getTeacherAssignments,
  updateAssignment,
  deleteAssignment,
};