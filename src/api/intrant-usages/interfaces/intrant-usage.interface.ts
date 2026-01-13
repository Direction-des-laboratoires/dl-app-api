import { Document } from 'mongoose';

export interface IntrantUsage extends Document {
  lab: any;
  intrant: any;
  quantity: number;
  unit: string;
  usedBy: any;
  usageDate: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

