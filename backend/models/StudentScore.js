const mongoose = require('mongoose');

const studentScoreSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    componentName: {
      type: String,
      required: true, // must match a component name from AssessmentConfig
    },
    scoreObtained: {
      type: Number,
      required: true,
      min: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 100,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StudentScore', studentScoreSchema);