import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionCategoryEnum } from 'src/utils/enums/question-category.enum';

export class CreateQuestionSectionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(QuestionCategoryEnum)
  category: QuestionCategoryEnum;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;
}
