import * as mongoose from 'mongoose';

export const SpecialitySchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },

  description: {
    type: String,
  },

  rank: {
    type: Number,
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
