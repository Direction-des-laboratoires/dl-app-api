import { Document } from 'mongoose';

export interface LabType extends Document {
  name: string;
  description?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}
