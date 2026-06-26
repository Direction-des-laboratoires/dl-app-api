import * as mongoose from 'mongoose';

export const StructureLevelEquipmentTypeSchema = new mongoose.Schema({
  structureLevel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StructureLevel',
    required: true,
  },
  equipmentType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EquipmentType',
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  required: {
    type: Boolean,
    default: false,
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

StructureLevelEquipmentTypeSchema.index(
  { structureLevel: 1, equipmentType: 1 },
  { unique: true },
);

StructureLevelEquipmentTypeSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
