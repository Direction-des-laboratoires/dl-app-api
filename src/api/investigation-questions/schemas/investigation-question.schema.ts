import * as mongoose from 'mongoose';

export const InvestigationQuestionSchema = new mongoose.Schema({
  investigation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investigation',
    required: true,
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  order: {
    type: Number,
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

InvestigationQuestionSchema.index(
  { investigation: 1, question: 1 },
  { unique: true },
);

InvestigationQuestionSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
