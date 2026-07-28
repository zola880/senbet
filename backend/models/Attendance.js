const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    required: true,
  },
});

const attendanceSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    date: {
      type: String, // "YYYY-MM-DD" format
      required: true,
    },
    records: [attendanceRecordSchema],
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// One attendance entry per class per day
attendanceSchema.index({ class: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);