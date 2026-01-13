import * as mongoose from 'mongoose';
import { UnitEnum } from 'src/utils/enums/unit.enum';

export const IntrantUsageSchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lab',
    required: true,
  },
  intrant: {
    type: mongoose.Schema.ObjectId,
    ref: 'Intrant',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  usedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  usageDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
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

IntrantUsageSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
