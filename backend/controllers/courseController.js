const Course = require('../models/Course');
const TeacherAssignment = require('../models/TeacherAssignment');

// @desc    Create course (admin & teacher)
// @route   POST /api/v1/courses
// @access  Private (admin, teacher)
const createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);

    // If a teacher created it, auto-assign to them (no class yet)
    if (req.user.role === 'teacher') {
      await TeacherAssignment.create({
        teacher: req.user._id,
        course: course._id,
        class: null,          // admin can assign class later
        academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
      });
    }

    // No optimization needed - course is already in memory from create()
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// @desc    Get courses (admin & student see all, teacher sees only assigned)
// @route   GET /api/v1/courses
// @access  Private
const getCourses = async (req, res, next) => {
  try {
    let courses;

    if (req.user.role === 'admin' || req.user.role === 'student') {
      // Admin and students can see all courses
      // OPTIMIZATION: Added .select() for only needed fields
      // OPTIMIZATION: Added .lean() for plain objects (2-3x faster)
      courses = await Course.find()
        .select('name code description')
        .sort({ name: 1 })
        .lean();
    } else if (req.user.role === 'teacher') {
      // OPTIMIZATION: Use .distinct() to get unique course IDs in one query
      // This replaces the JS-level deduplication (faster and cleaner)
      const courseIds = await TeacherAssignment.distinct('course', {
        teacher: req.user._id,
      });

      // Fetch courses with those IDs
      courses = await Course.find({ _id: { $in: courseIds } })
        .select('name code description')
        .sort({ name: 1 })
        .lean();
    } else {
      courses = [];
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course (admin, teacher if assigned, student can see)
// @route   GET /api/v1/courses/:id
// @access  Private
const getCourse = async (req, res, next) => {
  try {
    // OPTIMIZATION: Added .lean() for plain object (faster serialization)
    const course = await Course.findById(req.params.id).lean();
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // If teacher, verify they are assigned to this course
    if (req.user.role === 'teacher') {
      // OPTIMIZATION: Only select _id field and add .lean() for existence check
      const assignment = await TeacherAssignment.findOne({
        teacher: req.user._id,
        course: req.params.id,
      })
        .select('_id')
        .lean();

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this course',
        });
      }
    }

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course (admin only)
// @route   PUT /api/v1/courses/:id
// @access  Private/Admin
const updateCourse = async (req, res, next) => {
  try {
    // OPTIMIZATION: Added .lean() to returned document (faster serialization)
    // Note: We don't modify the document after update, just return it
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course (admin only)
// @route   DELETE /api/v1/courses/:id
// @access  Private/Admin
const deleteCourse = async (req, res, next) => {
  try {
    // No optimization needed - we don't return the document, just success message
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Also remove related TeacherAssignments
    await TeacherAssignment.deleteMany({ course: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Course deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
};