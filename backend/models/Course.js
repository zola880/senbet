const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    file: { type: String, default: null },
    fileType: { type: String, default: 'text' },
    originalName: String,
    type: {
      type: String,
      enum: ['material', 'homework', 'message'],
      default: 'material',
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date, default: null },   // ← new
  },
  { timestamps: true }
);

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    code: { type: String, trim: true },
    description: String,
    materials: [materialSchema],   // ← new field
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);