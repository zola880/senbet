const Homework = require('../models/Homework');
const TeacherAssignment = require('../models/TeacherAssignment');

// POST /api/v1/homework  (teacher only)
const createHomework = async (req, res, next) => {
  try {
    const { course, class: classId, title, description, dueDate } = req.body;

    // OPTIMIZATION: Added .select('_id') and .lean() for existence check
    // We only need to verify the assignment exists, don't need full document
    const assignment = await TeacherAssignment.findOne({
      teacher: req.user._id,
      course,
      class: classId,
    })
      .select('_id')
      .lean();

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this course/class',
      });
    }

    const homework = await Homework.create({
      course,
      class: classId,
      teacher: req.user._id,
      title,
      description,
      dueDate,
    });

    // No optimization needed - document already in memory from create()
    res.status(201).json({ success: true, data: homework });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/homework?course=..&class=..  (teacher or student in that class)
const getHomework = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.course) filter.course = req.query.course;
    if (req.query.class) filter.class = req.query.class;

    // If student, verify they belong to that class
    if (req.user.role === 'student') {
      if (!req.user.class || req.user.class.toString() !== req.query.class) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    // OPTIMIZATION: Added .select() for only needed fields
    // OPTIMIZATION: Added .lean() for plain objects (2-3x faster serialization)
    // Note: .populate('teacher', 'fullName') already has field selection - good!
    const homework = await Homework.find(filter)
      .select('title description dueDate course class teacher createdAt')
      .populate('teacher', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: homework });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/homework/:id (teacher who created it or admin)
const deleteHomework = async (req, res, next) => {
  try {
    // NO .lean() here - we need Mongoose document to check ownership and call .deleteOne()
    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      return res.status(404).json({
        success: false,
        message: 'Not found',
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' && homework.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    await homework.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createHomework, getHomework, deleteHomework };