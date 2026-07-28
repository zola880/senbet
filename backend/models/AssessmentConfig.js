const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['exam', 'activity', 'attendance', 'custom'],
    required: true,
  },
  weightage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  maxScore: {
    type: Number,
    default: 100,
  },
  // optional sub-components
  subComponents: [
    {
      name: String,
      maxMarks: Number,
      weightageWithinComponent: Number,
    },
  ],
});

const assessmentConfigSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      unique: true, // one config per class
    },
    academicYear: {
      type: String,
      required: true,
    },
    components: [componentSchema],
    passMark: {
      type: Number,
      default: 50,
    },
    rankingPeriod: {
      type: String,
      enum: ['semester1', 'semester2', 'full_year'],
      default: 'full_year',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure total weightage equals 100
assessmentConfigSchema.pre('save', function (next) {
  const total = this.components.reduce((sum, comp) => sum + comp.weightage, 0);
  if (total !== 100) {
    return next(new Error('Total weightage of all components must be exactly 100'));
  }
  next();
});

module.exports = mongoose.model('AssessmentConfig', assessmentConfigSchema);