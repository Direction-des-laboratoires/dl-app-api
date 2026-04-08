import { Document } from 'mongoose';
import {
  MaintenanceStatus,
  ScheduleFrequency,
} from '../schemas/maintenance.schema';

export interface Maintenance extends Document {
  equipment: any;
  technician: any;
  startDate?: Date;
  endDate?: Date;
  frequency: ScheduleFrequency;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  active: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}
