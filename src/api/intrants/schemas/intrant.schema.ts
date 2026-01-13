import * as mongoose from 'mongoose';
import { UnitEnum } from 'src/utils/enums/unit.enum';

export const IntrantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    unique: true,
    sparse: true,
  },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IntrantType',
    required: true,
  },
  description: {
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

IntrantSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
