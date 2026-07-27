import { Document, Types } from 'mongoose';
import { Investigation } from '../../investigations/interfaces/investigation.interface';
import { Question } from '../../questions/interfaces/question.interface';

export interface Response extends Document {
  lab: Types.ObjectId;
  investigation: Types.ObjectId | Investigation;
  question: Types.ObjectId | Question;
  responseValue: string | number;
  responseValuePrecision?: string;
  precisionOptionAutre?: string;
  created_at: Date;
  updated_at: Date;
}
