import { Document } from 'mongoose';
import { EquipmentLifeEventKind } from '../schemas/equipment-life-event.schema';

export interface EquipmentLifeEvent extends Document {
  equipment: unknown;
  kind: EquipmentLifeEventKind;
  maintenance?: unknown;
  previousValue?: string;
  newValue?: string;
  summary: string;
  actor?: unknown;
  occurredAt: Date;
  created_at: Date;
}
