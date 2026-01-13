import * as mongoose from 'mongoose';

export const EquipmentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  equipmentCategory: {
    type: mongoose.Schema.ObjectId,
    ref: 'EquipmentCategory',
    default: null,
  },
  notes: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
  updated_at: {
    type: Date,
    default: Date.now(),
  },
});

EquipmentTypeSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
