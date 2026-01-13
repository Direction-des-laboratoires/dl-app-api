import * as mongoose from 'mongoose';

export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  // PREDICTIVE = 'predictive',
  CALIBRATION = 'calibration',
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  PENDING = 'pending',
  FAILED = 'failed',
}

export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  ONCE = 'once',
}

export const MaintenanceSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Equipment',
    required: true,
  },
  maintenanceType: {
    type: String,
    enum: Object.values(MaintenanceType),
    required: true,
  },
  technician: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  frequency: {
    type: String,
    enum: Object.values(ScheduleFrequency),
    default: ScheduleFrequency.ONCE,
  },
  lastMaintenanceDate: {
    type: Date,
    default: null,
  },
  nextMaintenanceDate: {
    type: Date,
    default: null,
  },
  description: {
    type: String,
    default: '',
  },
  cost: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: Object.values(MaintenanceStatus),
    default: MaintenanceStatus.PENDING,
  },
  active: {
    type: Boolean,
    default: true,
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

MaintenanceSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
