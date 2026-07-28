const express = require('express');
const router = express.Router();
const {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const {
  addMaterial,
  getMaterials,
  deleteMaterial,
} = require('../controllers/materialController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// Existing routes ...
router.post('/', protect, authorize('admin', 'teacher'), createCourse);
router.get('/', protect, getCourses);
router.get('/:id', protect, getCourse);
router.put('/:id', protect, authorize('admin'), updateCourse);
router.delete('/:id', protect, authorize('admin'), deleteCourse);

// Materials routes
router.post(
  '/:courseId/materials',
  protect,
  authorize('admin'),
  upload.single('file'),
  addMaterial
);
router.get('/:courseId/materials', protect, getMaterials);
router.delete(
  '/:courseId/materials/:materialId',
  protect,
  authorize('admin'),
  deleteMaterial
);

module.exports = router;