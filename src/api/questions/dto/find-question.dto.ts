import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionCategoryEnum } from 'src/utils/enums/question-category.enum';
import { ResponseValueTypeEnum } from 'src/utils/enums/response-value-type.enum';

export class FindQuestionDto {
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
  @IsEnum(ResponseValueTypeEnum)
  responseValueType?: ResponseValueTypeEnum;

  @IsOptional()
  @IsString()
  search?: string;
}
