import * as mongoose from 'mongoose';

export const RegionSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  code: {
    type: String,
    unique: true,
    required: true,
  },
  pole: {
    type: mongoose.Schema.ObjectId,
    ref: 'RegionPole',
    required: true,
    default: null,
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
