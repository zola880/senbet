const Class = require('../models/Class');
const User = require('../models/User');

// @desc    Create a class
// @route   POST /api/v1/classes
// @access  Private/Admin
const createClass = async (req, res, next) => {
  try {
    const newClass = await Class.create(req.body);
    res.status(201).json({
      success: true,
      data: newClass,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all classes
// @route   GET /api/v1/classes
// @access  Private
const getClasses = async (req, res, next) => {
  try {
    const classes = await Class.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single class with students
// @route   GET /api/v1/classes/:id
// @access  Private
const getClass = async (req, res, next) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Get students belonging to this class
    const students = await User.find({ class: req.params.id, role: 'student' }).select('-password');

    res.status(200).json({
      success: true,
      data: {
        ...classData.toObject(),
        students,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update class
// @route   PUT /api/v1/classes/:id
// @access  Private/Admin
const updateClass = async (req, res, next) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.status(200).json({
      success: true,
      data: updatedClass,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete class
// @route   DELETE /api/v1/classes/:id
// @access  Private/Admin
const deleteClass = async (req, res, next) => {
  try {
    const classToDelete = await Class.findById(req.params.id);
    if (!classToDelete) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Optionally unassign students? We'll just remove class reference from students.
    await User.updateMany({ class: req.params.id }, { $unset: { class: '' } });
    await classToDelete.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
};