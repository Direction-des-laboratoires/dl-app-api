import { Document } from 'mongoose';

export interface Speciality extends Document {
  name: string;
  description: string;
  rank?: number;
  created_at: Date;
  updated_at: Date;
}
