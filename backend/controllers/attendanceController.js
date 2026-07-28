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

    const attendance = await Attendance.findOne({ class: classId, date })
      .populate('records.student', 'fullName rollNumber')
      .populate('markedBy', 'fullName');

    if (!attendance) {
      // No attendance taken yet – return list of students with status null
      const students = await User.find({ class: classId, role: 'student' }).select('fullName rollNumber');
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
      .populate('markedBy', 'fullName');

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance history for a student
// @route   GET /api/v1/attendance/student/:studentId
// @access  Private
const getStudentAttendance = async (req, res, next) => {
  try {
    const attendances = await Attendance.find({ 'records.student': req.params.studentId })
      .populate('class', 'name')
      .populate('records.student', 'fullName rollNumber')
      .sort({ date: -1 })
      .limit(60); // last 60 days

    // Format for student view
    const result = attendances.map(a => {
      const record = a.records.find(r => r.student._id.toString() === req.params.studentId);
      return {
        date: a.date,
        class: a.class.name,
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