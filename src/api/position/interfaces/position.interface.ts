import { Document } from 'mongoose';

export interface Position extends Document {
  title: string;
  description?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}
