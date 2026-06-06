import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionCategoryEnum } from 'src/utils/enums/question-category.enum';

export class FindQuestionSectionDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsEnum(QuestionCategoryEnum)
  category?: QuestionCategoryEnum;

  @IsOptional()
  @IsString()
  search?: string;
}
