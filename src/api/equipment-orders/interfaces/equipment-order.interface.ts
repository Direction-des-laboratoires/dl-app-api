import { Document } from 'mongoose';
import { OrderStatusEnum } from '../schemas/equipment-order.schema';
import { UnitEnum } from 'src/utils/enums/unit.enum';

export interface EquipmentOrderItem {
  equipmentType: any;
  brand?: string;
  modelName?: string;
  description: string;
  quantity: number;
  unit: UnitEnum;
  purchasePrice: number;
}

export interface EquipmentOrder extends Document {
  lab: string;
  supplier: any;
  cart: EquipmentOrderItem[];
  totalPrice: number;
  purchaseDate: Date;
  status: OrderStatusEnum;
  notes?: string;
  validatedBy?: any;
  completedBy?: any;
  created_at: Date;
  updated_at: Date;
}
