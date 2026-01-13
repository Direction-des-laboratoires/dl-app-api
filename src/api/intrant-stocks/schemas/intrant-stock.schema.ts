import * as mongoose from 'mongoose';
import { UnitEnum } from 'src/utils/enums/unit.enum';

export const IntrantStockSchema = new mongoose.Schema({
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
  initialQuantity: {
    type: Number,
    required: true,
    default: 0,
  },
  usedQuantity: {
    type: Number,
    required: true,
    default: 0,
  },
  remainingQuantity: {
    type: Number,
    required: true,
    default: 0,
  },
  unit: {
    type: String,
    enum: Object.values(UnitEnum),
    required: true,
  },
  minThreshold: {
    type: Number,
    default: 0,
  },
  expiryDate: {
    type: Date,
    default: null,
  },
  batchNumber: {
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

IntrantStockSchema.index({ lab: 1, intrant: 1 }, { unique: true });

IntrantStockSchema.pre('save', function (next) {
  this.updated_at = new Date();
  this.remainingQuantity = this.initialQuantity - this.usedQuantity;
  if (this.remainingQuantity < 0) this.remainingQuantity = 0;
  next();
});
