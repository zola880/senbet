const mongoose = require('mongoose');

const promotionRecordSchema = new mongoose.Schema(
  {
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PromotionBatch',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fromClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    toClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    averageScore: {
      type: Number,
      required: true,
    },
    passMark: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['promoted', 'retained', 'graduated'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

promotionRecordSchema.index({ batch: 1 });
promotionRecordSchema.index({ student: 1 });

module.exports = mongoose.model('PromotionRecord', promotionRecordSchema);