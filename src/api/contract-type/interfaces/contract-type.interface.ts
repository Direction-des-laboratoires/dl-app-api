import { Document } from 'mongoose';

export interface ContractType extends Document {
  name: string;
  code: string;
  description?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}
