const mongoose = require('mongoose');

const developmentRecordSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Please specify income or expense'],
    },
    // For income: the source (e.g. "Donation from ...")
    // For expense: the item bought (e.g. "Bought 2 chairs")
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please add the amount'],
      min: 0,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

developmentRecordSchema.index({ date: -1 });
developmentRecordSchema.index({ type: 1, date: -1 });

module.exports = mongoose.model('DevelopmentRecord', developmentRecordSchema);