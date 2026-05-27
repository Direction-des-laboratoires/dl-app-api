import { Document, Types } from 'mongoose';
import { Investigation } from '../../investigations/interfaces/investigation.interface';
import { Question } from '../../questions/interfaces/question.interface';

export interface InvestigationQuestion extends Document {
  investigation: Types.ObjectId | Investigation;
  question: Types.ObjectId | Question;
  order?: number;
  created_at: Date;
  updated_at: Date;
}
