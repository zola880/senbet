const Announcement = require('../models/Announcement');
const TeacherAssignment = require('../models/TeacherAssignment');

// POST /api/v1/announcements (teacher)
const createAnnouncement = async (req, res, next) => {
  try {
    const { course, class: classId, title, content } = req.body;
    const assignment = await TeacherAssignment.findOne({
      teacher: req.user._id,
      course,
      class: classId,
    });
    if (!assignment) return res.status(403).json({ success: false, message: 'Not assigned' });

    const ann = await Announcement.create({
      course, class: classId, teacher: req.user._id, title, content,
    });
    res.status(201).json({ success: true, data: ann });
  } catch (error) { next(error); }
};

// GET /api/v1/announcements?course=..&class=..
const getAnnouncements = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.course) filter.course = req.query.course;
    if (req.query.class) filter.class = req.query.class;
    if (req.user.role === 'student') {
      if (!req.user.class || req.user.class.toString() !== req.query.class) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }
    const anns = await Announcement.find(filter).populate('teacher', 'fullName').sort('-date');
    res.status(200).json({ success: true, data: anns });
  } catch (error) { next(error); }
};

// DELETE /api/v1/announcements/:id
const deleteAnnouncement = async (req, res, next) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.user.role !== 'admin' && ann.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await ann.deleteOne();
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
};

module.exports = { createAnnouncement, getAnnouncements, deleteAnnouncement };