import * as mongoose from 'mongoose';
import { UnitEnum } from 'src/utils/enums/unit.enum';

export enum OrderStatusEnum {
  PENDING = 'pending',
  VALIDATED = 'validated',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
}

export const EquipmentOrderSchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lab',
    default: null,
  },
  supplier: {
    type: mongoose.Schema.ObjectId,
    ref: 'Supplier',
    default: null,
  },
  cart: [
    {
      equipmentType: {
        type: mongoose.Schema.ObjectId,
        ref: 'EquipmentType',
        required: true,
      },
      brand: {
        type: String,
      },
      modelName: {
        type: String,
      },
      description: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      unit: {
        type: String,
        enum: Object.values(UnitEnum),
        required: true,
        default: UnitEnum.UNIT,
      },
      purchasePrice: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  totalPrice: {
    type: Number,
    default: 0,
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  status: {
    type: String,
    enum: Object.values(OrderStatusEnum),
    default: OrderStatusEnum.PENDING,
  },
  notes: {
    type: String,
  },
  validatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  completedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

EquipmentOrderSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
