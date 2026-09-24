const mongoose = require('mongoose');

const promotionBatchSchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      required: true,
    },
    runBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    runAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['preview', 'applied', 'rolled_back'],
      default: 'preview',
    },
    summary: {
      totalStudents: Number,
      promoted: Number,
      retained: Number,
      graduated: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PromotionBatch', promotionBatchSchema);