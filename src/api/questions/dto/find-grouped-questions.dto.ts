import { IsEnum, IsOptional } from 'class-validator';
import { QuestionCategoryEnum } from 'src/utils/enums/question-category.enum';

export class FindGroupedQuestionsDto {
  @IsOptional()
  @IsEnum(QuestionCategoryEnum)
  category?: QuestionCategoryEnum;
}
