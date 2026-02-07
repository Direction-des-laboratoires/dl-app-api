import * as mongoose from 'mongoose';

export const EnvironmentPositionSchema = new mongoose.Schema({
  environment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Environment',
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
