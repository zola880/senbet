const mongoose = require('mongoose');

const churchClothRecordSchema = new mongoose.Schema(
  {
    borrowerName: {
      type: String,
      required: [true, 'Borrower name is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    borrowedDate: {
      type: Date,
      required: [true, 'Borrowed date is required'],
    },
    expectedReturnDate: {
      type: Date,
      default: null,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['borrowed', 'returned'],
      default: 'borrowed',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ChurchClothRecord', churchClothRecordSchema);
