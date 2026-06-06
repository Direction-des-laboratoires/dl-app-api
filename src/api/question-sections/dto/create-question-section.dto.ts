import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { QuestionCategoryEnum } from 'src/utils/enums/question-category.enum';

export class CreateQuestionSectionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(QuestionCategoryEnum)
  category: QuestionCategoryEnum;
}
