import * as mongoose from 'mongoose';

export const EnvironmentPositionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  environment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Environment',
    required: true,
  },
  description: {
    type: String,
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
