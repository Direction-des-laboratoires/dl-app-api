import * as mongoose from 'mongoose';

/** Nature de l’entrée dans la fiche de vie */
export enum EquipmentLifeEventKind {
  EQUIPMENT_CREATED = 'equipment_created',
  EQUIPMENT_RECEIVED = 'equipment_received',
  EQUIPMENT_STATUS_CHANGED = 'equipment_status_changed',
  EQUIPMENT_INVENTORY_STATUS_CHANGED = 'equipment_inventory_status_changed',
  EQUIPMENT_RECEPTION_STATUS_CHANGED = 'equipment_reception_status_changed',
  /** Autres champs de la fiche équipement modifiés (détail dans newValue JSON) */
  EQUIPMENT_DETAILS_UPDATED = 'equipment_details_updated',
  EQUIPMENT_REMOVED = 'equipment_removed',
  MAINTENANCE_CREATED = 'maintenance_created',
  MAINTENANCE_STATUS_CHANGED = 'maintenance_status_changed',
  /** Entrée libre ajoutée par un utilisateur */
  MANUAL_NOTE = 'manual_note',
}

export const EquipmentLifeEventSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true,
    index: true,
  },
  kind: {
    type: String,
    enum: Object.values(EquipmentLifeEventKind),
    required: true,
  },
  maintenance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maintenance',
    default: null,
  },
  previousValue: {
    type: String,
    default: null,
  },
  newValue: {
    type: String,
    default: null,
  },
  summary: {
    type: String,
    default: '',
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  occurredAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

EquipmentLifeEventSchema.index({ equipment: 1, occurredAt: -1 });
