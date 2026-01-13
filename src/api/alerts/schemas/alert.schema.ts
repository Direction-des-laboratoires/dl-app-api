import * as mongoose from 'mongoose';

export enum AlertType {
  MAINTENANCE_REMINDER = 'maintenance_reminder',
  EQUIPMENT_EXPIRY = 'equipment-type_expiry',
  LOW_STOCK = 'low_stock',
  SYSTEM = 'system',
}

export enum AlertStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read',
}

export const AlertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(AlertType),
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false, // Peut être nul si c'est une alerte système globale
  },
  relatedId: {
    type: mongoose.Schema.ObjectId, // ID de l'objet lié (ex: ID du planning de maintenance)
    required: false,
  },
  status: {
    type: String,
    enum: Object.values(AlertStatus),
    default: AlertStatus.PENDING,
  },
  sentAt: {
    type: Date,
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

AlertSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
