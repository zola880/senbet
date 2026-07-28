const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      unique: true, // e.g., "ሃ1", "ለ", "ትላልቆች"
      trim: true,
    },
    gradeLevel: {
      type: String,
      trim: true,
    },
    description: String,
    // We'll not store students array here; instead reference from User model (student.class)
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Class', classSchema);