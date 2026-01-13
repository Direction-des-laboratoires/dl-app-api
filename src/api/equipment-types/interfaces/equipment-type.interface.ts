import { Document } from 'mongoose';

export interface EquipmentType extends Document {
  name: string;
  description?: string;
  equipmentCategory?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}
