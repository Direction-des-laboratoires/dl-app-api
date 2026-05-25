import * as mongoose from 'mongoose';

export const ResponseSchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lab',
    required: true,
  },
  question: {
    type: mongoose.Schema.ObjectId,
    ref: 'Question',
    required: true,
  },
  responseValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  responseValuePrecision: {
    type: String,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

ResponseSchema.index({ lab: 1, question: 1 }, { unique: true });

ResponseSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
