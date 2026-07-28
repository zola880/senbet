const mongoose = require('mongoose');

const practiceSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    practiceType: {
      type: String,
      required: true,
      trim: true,
    },
    dayOfWeek: {
      type: Number, // 0=Sunday, 6=Saturday
      min: 0,
      max: 6,
      default: null, // if one-time, not required
    },
    startTime: {
      type: String,
      required: true, // e.g., "14:00"
    },
    endTime: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      default: null, // for one-time session
    },
    endDate: {
      type: Date,
      default: null,
    },
    recurring: {
      type: Boolean,
      default: false,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    description: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PracticeSession', practiceSessionSchema);