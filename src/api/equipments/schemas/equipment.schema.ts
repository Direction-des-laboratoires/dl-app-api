import * as mongoose from 'mongoose';

export enum EquipmentStatus {
  OPERATIONAL = 'operational',
  BROKEN = 'broken',
  MAINTENANCE = 'maintenance',
  OUT_OF_ORDER = 'out_of_order',
}

export enum InventoryStatus {
  IN_DELIVERY = 'in_delivery',
  AVAILABLE = 'available',
  IN_STOCK = 'in_stock',
  IN_USE = 'in_use',
  RETIRED = 'retired',
}

export const EquipmentSchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lab',
    default: null,
  },
  equipmentType: {
    type: mongoose.Schema.ObjectId,
    ref: 'EquipmentType',
    required: true,
  },
  serialNumber: {
    type: String,
    unique: true,
    default: null,
  },
  modelName: {
    type: String,
  },
  brand: {
    type: String,
  },
  status: {
    type: String,
    enum: Object.values(EquipmentStatus),
    default: EquipmentStatus.OPERATIONAL,
  },
  inventoryStatus: {
    type: String,
    enum: Object.values(InventoryStatus),
    default: InventoryStatus.IN_DELIVERY,
  },
  affectedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  receivedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  receivedDate: {
    type: Date,
    default: null,
  },
  affectedToBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  purchaseDate: {
    type: Date,
  },
  warrantyExpiryDate: {
    type: Date,
  },
  lastMaintenanceDate: {
    type: Date,
  },
  nextMaintenanceDate: {
    type: Date,
  },
  notes: {
    type: String,
  },
  createdBy: {
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

EquipmentSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
