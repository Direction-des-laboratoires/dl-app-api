import { Document } from 'mongoose';
import {
  MaintenanceType,
  MaintenanceStatus,
  ScheduleFrequency,
} from '../schemas/maintenance.schema';

export interface Maintenance extends Document {
  equipment: any;
  maintenanceType: MaintenanceType;
  technician: any;
  date: Date;
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
