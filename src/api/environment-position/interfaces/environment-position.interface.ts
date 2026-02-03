import { Document } from 'mongoose';
import { Environment } from '../../environment/interfaces/environment.interface';

export interface EnvironmentPosition extends Document {
  title: string;
  environment: Environment | string;
  description?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}
