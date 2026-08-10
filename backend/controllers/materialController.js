const fs = require('fs');
const Course = require('../models/Course');
const TeacherAssignment = require('../models/TeacherAssignment');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper: notify all students in the classes linked to a course
const notifyStudentsInCourse = async (courseId, title, description, type, dueDate) => {
  try {
    // OPTIMIZATION: Only select 'class' field instead of populating full class documents
    // OPTIMIZATION: Added .lean() for plain objects (faster iteration)
    const assignments = await TeacherAssignment.find({ course: courseId })
      .select('class')
      .lean();

    const classIds = assignments
      .map(a => a.class)
      .filter(Boolean);

    if (classIds.length === 0) return;

    // Get all students in those classes
    // OPTIMIZATION: Already has .select('_id') - good!
    // OPTIMIZATION: Added .lean() for plain objects
    const students = await User.find({
      role: 'student',
      class: { $in: classIds },
    })
      .select('_id')
      .lean();

    if (students.length === 0) return;

    // Build notification message (append due date if present)
    let msg = description || '';
    if (dueDate) {
      msg += ` (Due: ${new Date(dueDate).toLocaleDateString()})`;
    }

    // Create a notification for each student
    const notifications = students.map(student => ({
      recipient: student._id,
      title,
      message: msg,
      course: courseId,
      type,
    }));

    // OPTIMIZATION: Added ordered: false for faster parallel inserts
    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { ordered: false });
    }
  } catch (err) {
    console.error('Failed to send notifications:', err);
  }
};

// @desc    Add material / homework / message to a course
// @route   POST /api/v1/courses/:courseId/materials
// @access  Private (admin or assigned teacher)
const addMaterial = async (req, res, next) => {
  try {
    // NO .lean() here - we need Mongoose document to call .save() after push
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Permission check
    if (req.user.role === 'teacher') {
      // OPTIMIZATION: Added .select('_id') and .lean() for existence check
      const assignment = await TeacherAssignment.findOne({
        teacher: req.user._id,
        course: req.params.courseId,
      })
        .select('_id')
        .lean();

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this course',
        });
      }
    }

    const { title, description, type, dueDate } = req.body;
    const file = req.file;

    let finalTitle = title;
    if (!finalTitle && type === 'message') {
      finalTitle = `Message from ${req.user.fullName}`;
    } else if (!finalTitle && type === 'homework') {
      finalTitle = 'Homework assignment';
    } else if (!finalTitle) {
      finalTitle = file ? file.originalname : 'Untitled';
    }

    let fileType = 'text';
    let filePath = null;

    if (file) {
      const mime = file.mimetype;
      if (mime.startsWith('image/')) fileType = 'image';
      else if (mime === 'application/pdf') fileType = 'pdf';
      else fileType = 'document';
      filePath = file.path;
    }

    const material = {
      title: finalTitle,
      description: description || '',
      file: filePath,
      fileType: file ? fileType : 'text',
      originalName: file ? file.originalname : null,
      type: type || 'material',
      postedBy: req.user._id,
      dueDate: dueDate || null,
    };

    course.materials.push(material);
    await course.save();

    // Notify students for messages, announcements, AND homework
    if (type === 'message' || type === 'announcement' || type === 'homework') {
      // Run notifications in background (don't await) to respond faster
      // Students will still get notifications, just with a tiny delay
      notifyStudentsInCourse(req.params.courseId, finalTitle, description, type, dueDate);
    }

    res.status(201).json({
      success: true,
      data: course.materials[course.materials.length - 1],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all materials for a course
// @route   GET /api/v1/courses/:courseId/materials
// @access  Private
const getMaterials = async (req, res, next) => {
  try {
    // OPTIMIZATION: Added .lean() for plain objects (2-3x faster serialization)
    // Note: .select('materials') already limits fields - good!
    const course = await Course.findById(req.params.courseId)
      .select('materials')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      data: course.materials,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a material
// @route   DELETE /api/v1/courses/:courseId/materials/:materialId
// @access  Private (Admin or the teacher who posted it)
const deleteMaterial = async (req, res, next) => {
  try {
    // NO .lean() here - we need Mongoose methods:
    //   course.materials.id() - find subdocument by ID
    //   material.deleteOne() - remove subdocument
    //   course.save() - persist changes
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const material = course.materials.id(req.params.materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }

    if (req.user.role === 'teacher' && material.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this material',
      });
    }

    if (material.file) {
      fs.unlink(material.file, (err) => {
        if (err) console.error('Failed to delete file:', err);
      });
    }

    material.deleteOne();
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Material deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addMaterial,
  getMaterials,
  deleteMaterial,
};