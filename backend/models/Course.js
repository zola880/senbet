const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    file: { type: String, required: true },   // path to file in uploads/
    fileType: { type: String, required: true }, // e.g., 'image', 'pdf', 'document'
    originalName: String,                      // original filename
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