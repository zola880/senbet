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
      courses = await Course.find().sort({ name: 1 });
    } else if (req.user.role === 'teacher') {
      // Teacher sees only assigned courses
      const assignments = await TeacherAssignment.find({ teacher: req.user._id })
        .populate('course')
        .select('course');
      courses = assignments.map((a) => a.course).filter(Boolean);
      // Remove duplicates
      const uniqueCourses = [];
      const seen = new Set();
      for (const c of courses) {
        if (!seen.has(c._id.toString())) {
          uniqueCourses.push(c);
          seen.add(c._id.toString());
        }
      }
      courses = uniqueCourses;
    } else {
      courses = [];
    }

    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course (admin, teacher if assigned, student can see)
// @route   GET /api/v1/courses/:id
// @access  Private
const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // If teacher, verify they are assigned to this course
    if (req.user.role === 'teacher') {
      const assignment = await TeacherAssignment.findOne({
        teacher: req.user._id,
        course: req.params.id,
      });
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
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
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
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    // Also remove related TeacherAssignments
    await TeacherAssignment.deleteMany({ course: req.params.id });
    res.status(200).json({ success: true, message: 'Course deleted' });
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