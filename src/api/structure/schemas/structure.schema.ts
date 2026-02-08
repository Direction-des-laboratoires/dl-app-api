import * as mongoose from 'mongoose';
import {
  StructureLevelEnum,
  StructureStatusEnum,
} from 'src/utils/enums/structure.enum';

export const StructureSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    required: true,
    enum: StructureStatusEnum,
    default: StructureStatusEnum.PUBLIC,
  },
  level: {
    type: mongoose.Schema.ObjectId,
    ref: 'StructureLevel',
    default: null,
  },
  region: {
    type: mongoose.Schema.ObjectId,
    ref: 'Region',
    required: true,
  },
  department: {
    type: mongoose.Schema.ObjectId,
    ref: 'Department',
    default: null,
  },
  district: {
    type: mongoose.Schema.ObjectId,
    ref: 'District',
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
