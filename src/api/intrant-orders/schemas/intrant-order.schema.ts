import * as mongoose from 'mongoose';
import { UnitEnum } from 'src/utils/enums/unit.enum';

export enum IntrantOrderStatusEnum {
  PENDING = 'pending',
  VALIDATED = 'validated',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
}

export const IntrantOrderSchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lab',
    default: null,
  },
  supplier: {
    type: mongoose.Schema.ObjectId,
    ref: 'Supplier',
    default: null,
  },
  intrant: {
    type: mongoose.Schema.ObjectId,
    ref: 'Intrant',
    required: true,
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    enum: Object.values(UnitEnum),
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  batchNumber: {
    type: String,
    unique: true,
  },
  status: {
    type: String,
    enum: Object.values(IntrantOrderStatusEnum),
    default: IntrantOrderStatusEnum.PENDING,
  },
  notes: {
    type: String,
  },
  validatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  completedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
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

IntrantOrderSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
