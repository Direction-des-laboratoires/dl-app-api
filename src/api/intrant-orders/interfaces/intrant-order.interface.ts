import { Document } from 'mongoose';
import { UnitEnum } from 'src/utils/enums/unit.enum';
import { IntrantOrderStatusEnum } from '../schemas/intrant-order.schema';

export interface IntrantOrder extends Document {
  lab: any;
  supplier: any;
  intrant: any;
  purchaseDate: Date;
  purchasePrice: number;
  unit: UnitEnum;
  quantity: number;
  batchNumber: string;
  status: IntrantOrderStatusEnum;
  notes?: string;
  validatedBy?: any;
  completedBy?: any;
  created_at: Date;
  updated_at: Date;
}
