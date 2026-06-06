import { Document } from 'mongoose';
import { QuestionCategoryEnum } from 'src/utils/enums/question-category.enum';

export interface QuestionSection extends Document {
  name: string;
  category: QuestionCategoryEnum;
  created_at: Date;
  updated_at: Date;
}
