import { Document } from 'mongoose';
import {
  EquipmentStatus,
  InventoryStatus,
} from '../schemas/equipment.schema';

export interface Equipment extends Document {
  lab: string;
  equipmentType: any;
  serialNumber: string;
  modelName?: string;
  brand?: string;
  status: EquipmentStatus;
  inventoryStatus: InventoryStatus;
  affectedTo?: string;
  receivedBy?: string;
  receivedDate?: Date;
  affectedToBy?: string;
  warrantyExpiryDate?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  notes?: string;
  createdBy?: string;
  created_at: Date;
  updated_at: Date;
}
