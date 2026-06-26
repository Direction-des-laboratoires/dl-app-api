import { Document } from 'mongoose';
import { LabType } from '../../lab-type/interfaces/lab-type.interface';
import { Position } from '../../position/interfaces/position.interface';

export interface LabTypePosition extends Document {
  labType: LabType | string;
  position: Position | string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}
