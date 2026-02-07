import { Document } from 'mongoose';
import { Environment } from '../../environment/interfaces/environment.interface';
import { Position } from '../../position/interfaces/position.interface';

export interface EnvironmentPosition extends Document {
  environment: Environment | string;
  position: Position | string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}
