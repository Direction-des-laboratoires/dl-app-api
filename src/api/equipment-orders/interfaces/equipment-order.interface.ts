import { Document } from 'mongoose';
import { OrderStatusEnum } from '../schemas/equipment-order.schema';
import { UnitEnum } from 'src/utils/enums/unit.enum';

export interface EquipmentOrder extends Document {
  lab: string;
  supplier: any;
  equipmentType: any;
  description: string;
  purchaseDate: Date;
  purchasePrice: number;
  quantity: number;
  unit: UnitEnum;
  status: OrderStatusEnum;
  notes?: string;
  validatedBy?: any;
  completedBy?: any;
  created_at: Date;
  updated_at: Date;
}
