import * as mongoose from 'mongoose';
import { InvestigationStatusEnum } from 'src/utils/enums/investigation-status.enum';
import { InvestigationType } from 'src/utils/enums/investigation-type.enum';

export const InvestigationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  active: {
    type: Boolean,
    default: true,
  },
  type: {
    type: String,
    enum: Object.values(InvestigationType),
    default: InvestigationType.GENERAL,
  },
  status: {
    type: String,
    enum: Object.values(InvestigationStatusEnum),
    default: InvestigationStatusEnum.DRAFT,
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
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

InvestigationSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
