import { Document } from 'mongoose';

export interface StructureLevelEquipmentType extends Document {
  structureLevel: string;
  equipmentType: string;
  quantity: number;
  required: boolean;
  created_at: Date;
  updated_at: Date;
}
