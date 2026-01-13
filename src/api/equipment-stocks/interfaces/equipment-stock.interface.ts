import { Document } from 'mongoose';
import { UnitEnum } from 'src/utils/enums/unit.enum';

export interface EquipmentStock extends Document {
  lab: any;
  equipmentType: any;
  initialQuantity: number;
  remainingQuantity: number;
  usedQuantity: number;
  unit: UnitEnum;
  minThreshold: number;
  order?: any;
  created_at: Date;
  updated_at: Date;
}
