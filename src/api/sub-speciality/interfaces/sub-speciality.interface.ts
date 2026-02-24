import { Document } from 'mongoose';

export interface SubSpeciality extends Document {
  name: string;
  description: string;
  rank?: number;
  created_at: Date;
  updated_at: Date;
}
