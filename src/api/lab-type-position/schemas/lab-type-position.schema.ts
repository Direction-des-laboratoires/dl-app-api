import * as mongoose from 'mongoose';

export const LabTypePositionSchema = new mongoose.Schema({
  labType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabType',
    required: true,
  },
  position: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position',
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
  },
});

LabTypePositionSchema.index({ labType: 1, position: 1 }, { unique: true });
