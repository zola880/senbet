const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Get attendance for a class on a specific date
// @route   GET /api/v1/attendance?class=...&date=YYYY-MM-DD
// @access  Private (admin, teacher)
const getAttendance = async (req, res, next) => {
  try {
    const { class: classId, date } = req.query;
    if (!classId || !date) {
      return res.status(400).json({ success: false, message: 'Class and date are required' });
    }

    // OPTIMIZATION: Added .lean() for plain objects (faster serialization)
    // Note: Populates already have field selection - good!
    const attendance = await Attendance.findOne({ class: classId, date })
      .populate('records.student', 'fullName rollNumber')
      .populate('markedBy', 'fullName')
      .lean();

    if (!attendance) {
      // No attendance taken yet – return list of students with status null
      // OPTIMIZATION: Added .lean() for plain objects
      const students = await User.find({ class: classId, role: 'student' })
        .select('fullName rollNumber')
        .lean();

      return res.status(200).json({
        success: true,
        data: {
          class: classId,
          date,
          records: students.map(s => ({ student: s, status: null })),
          markedBy: null,
        },
      });
    }

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark attendance (create or update)
// @route   POST /api/v1/attendance
// @access  Private (admin, teacher)
const markAttendance = async (req, res, next) => {
  try {
    const { class: classId, date, records } = req.body;
    // records: [{ student: id, status: 'present'|'absent'|'late' }]

    if (!classId || !date || !records) {
      return res.status(400).json({ success: false, message: 'Class, date, and records are required' });
    }

    // Upsert
    // OPTIMIZATION: Added .lean() to returned document (faster serialization)
    // Note: We don't modify the document after update, so .lean() is safe
    const attendance = await Attendance.findOneAndUpdate(
      { class: classId, date },
      {
        class: classId,
        date,
        records,
        markedBy: req.user._id,
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate('records.student', 'fullName rollNumber')
      .populate('markedBy', 'fullName')
      .lean();

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance history for a student (with optional date range)
// @route   GET /api/v1/attendance/student/:studentId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private
const getStudentAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const studentId = req.params.studentId;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = startDate;
      if (endDate) dateFilter.date.$lte = endDate;
    }

    // OPTIMIZATION: Added .lean() for plain objects (much faster for history queries)
    // Note: .toString() on ObjectId still works with .lean()
    const attendances = await Attendance.find({
      'records.student': studentId,
      ...dateFilter,
    })
      .populate('class', 'name')
      .populate('records.student', 'fullName rollNumber')
      .sort({ date: -1 })
      .lean();

    // Format for student view
    const result = attendances.map(a => {
      const record = a.records.find(
        r => r.student._id.toString() === studentId
      );
      return {
        date: a.date,
        class: a.class ? a.class.name : 'Unknown Class', // Guard against null class
        status: record ? record.status : 'unknown',
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendance,
  markAttendance,
  getStudentAttendance,
};