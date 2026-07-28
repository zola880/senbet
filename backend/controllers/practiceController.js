const PracticeSession = require('../models/PracticeSession');

// @desc    Create practice session
// @route   POST /api/v1/practices
// @access  Private/Admin
const createPractice = async (req, res, next) => {
  try {
    const practice = await PracticeSession.create(req.body);
    const populated = await PracticeSession.findById(practice._id)
      .populate('class', 'name')
      .populate('assignedStudents', 'fullName')
      .populate('supervisor', 'fullName');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all practice sessions (with optional filters)
// @route   GET /api/v1/practices
// @access  Private
const getPractices = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.class) filter.class = req.query.class;
    if (req.query.supervisor) filter.supervisor = req.query.supervisor;
    if (req.query.recurring) filter.recurring = req.query.recurring === 'true';

    const practices = await PracticeSession.find(filter)
      .populate('class', 'name')
      .populate('assignedStudents', 'fullName')
      .populate('supervisor', 'fullName');
    res.status(200).json({ success: true, count: practices.length, data: practices });
  } catch (error) {
    next(error);
  }
};

// @desc    Get practice sessions for the logged-in user (student/teacher)
// @route   GET /api/v1/practices/my
// @access  Private
const getMyPractices = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let filter = {};

    if (role === 'student') {
      // Sessions where student is either directly assigned or the session's class matches student's class
      const studentClass = req.user.class;
      filter = {
        $or: [
          { assignedStudents: userId },
          { class: studentClass, assignedStudents: { $size: 0 } }, // class-wide session with no specific assigned list
        ],
      };
    } else if (role === 'teacher') {
      filter = { supervisor: userId };
    } else {
      // Admin sees all, handled by getPractices
      return getPractices(req, res, next);
    }

    const practices = await PracticeSession.find(filter)
      .populate('class', 'name')
      .populate('supervisor', 'fullName')
      .sort({ startDate: 1, startTime: 1 });
    res.status(200).json({ success: true, count: practices.length, data: practices });
  } catch (error) {
    next(error);
  }
};

// @desc    Update practice session
// @route   PUT /api/v1/practices/:id
// @access  Private/Admin
const updatePractice = async (req, res, next) => {
  try {
    const practice = await PracticeSession.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('class supervisor assignedStudents', 'fullName name');
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Practice not found' });
    }
    res.status(200).json({ success: true, data: practice });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete practice session
// @route   DELETE /api/v1/practices/:id
// @access  Private/Admin
const deletePractice = async (req, res, next) => {
  try {
    const practice = await PracticeSession.findByIdAndDelete(req.params.id);
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Practice not found' });
    }
    res.status(200).json({ success: true, message: 'Practice deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPractice,
  getPractices,
  getMyPractices,
  updatePractice,
  deletePractice,
};