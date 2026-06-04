import * as mongoose from 'mongoose';
import { QuestionCategoryEnum } from 'src/utils/enums/question-category.enum';
import { ResponseValueTypeEnum } from 'src/utils/enums/response-value-type.enum';

export const QuestionSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: Object.values(QuestionCategoryEnum),
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  responseValueType: {
    type: String,
    enum: Object.values(ResponseValueTypeEnum),
    required: true,
  },
  isRequired: {
    type: Boolean,
    default: false,
  },
  responsePrecisionCondition: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

QuestionSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
