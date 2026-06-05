import { Document } from 'mongoose';
import { QuestionCategoryEnum } from 'src/utils/enums/question-category.enum';
import { ResponseValueTypeEnum } from 'src/utils/enums/response-value-type.enum';

export interface Question extends Document {
  category: QuestionCategoryEnum;
  label: string;
  responseValueType: ResponseValueTypeEnum;
  isRequired: boolean;
  responsePrecisionCondition?: string | number | null;
  options: string[];
  created_at: Date;
  updated_at: Date;
}
