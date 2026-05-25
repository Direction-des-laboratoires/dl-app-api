import { Document, Types } from 'mongoose';
import { Question } from '../../questions/interfaces/question.interface';

export interface Response extends Document {
  lab: Types.ObjectId;
  question: Types.ObjectId | Question;
  responseValue: string | number;
  responseValuePrecision?: string;
  created_at: Date;
  updated_at: Date;
}
