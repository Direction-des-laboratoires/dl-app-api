import { Document, Types } from 'mongoose';
import { QuestionCategoryEnum } from 'src/utils/enums/question-category.enum';
import { ResponseValueTypeEnum } from 'src/utils/enums/response-value-type.enum';
import { QuestionSection } from '../../question-sections/interfaces/question-section.interface';

export interface Question extends Document {
  section: Types.ObjectId | QuestionSection;
  category: QuestionCategoryEnum;
  label: string;
  responseValueType: ResponseValueTypeEnum;
  isRequired: boolean;
  responsePrecisionCondition?: string | number | null;
  precisionLabel?: string | null;
  precisionValueType?: ResponseValueTypeEnum | null;
  precisionOptions: string[];
  options: string[];
  created_at: Date;
  updated_at: Date;
}
