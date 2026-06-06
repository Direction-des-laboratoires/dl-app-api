import * as mongoose from 'mongoose';
import { QuestionCategoryEnum } from 'src/utils/enums/question-category.enum';

export const QuestionSectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: Object.values(QuestionCategoryEnum),
    required: true,
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

QuestionSectionSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
