const Course = require('../models/Course');

// @desc    Add material to a course
// @route   POST /api/v1/courses/:courseId/materials
// @access  Private/Admin
const addMaterial = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const { title, description } = req.body;
    const file = req.file;  // multer attaches file

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let fileType = 'document';
    const mime = file.mimetype;
    if (mime.startsWith('image/')) fileType = 'image';
    else if (mime === 'application/pdf') fileType = 'pdf';

    const material = {
      title: title || file.originalname,
      description: description || '',
      file: file.path,              // e.g., uploads/123456789.jpg
      fileType,
      originalName: file.originalname,
    };

    course.materials.push(material);
    await course.save();

    res.status(201).json({ success: true, data: course.materials[course.materials.length - 1] });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all materials for a course
// @route   GET /api/v1/courses/:courseId/materials
// @access  Private
const getMaterials = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId).select('materials');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(200).json({ success: true, data: course.materials });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a material from a course
// @route   DELETE /api/v1/courses/:courseId/materials/:materialId
// @access  Private/Admin
const deleteMaterial = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const material = course.materials.id(req.params.materialId);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    // Remove file from disk
    const fs = require('fs');
    fs.unlink(material.file, (err) => {
      if (err) console.error('Failed to delete file:', err);
    });

    material.deleteOne();
    await course.save();

    res.status(200).json({ success: true, message: 'Material deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addMaterial,
  getMaterials,
  deleteMaterial,
};