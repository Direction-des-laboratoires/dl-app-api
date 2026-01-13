import { Document } from 'mongoose';

export interface Intrant extends Document {
  name: string;
  code: string;
  type: any;
  description?: string;
  created_at: Date;
  updated_at: Date;
}
