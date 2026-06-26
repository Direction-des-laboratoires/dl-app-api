import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { QuestionCategoryEnum } from 'src/utils/enums/question-category.enum';
import { ResponseValueTypeEnum } from 'src/utils/enums/response-value-type.enum';

export class CreateQuestionDto {
  @IsNotEmpty()
  @IsMongoId()
  section: string;

  @IsNotEmpty()
  @IsEnum(QuestionCategoryEnum)
  category: QuestionCategoryEnum;

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsNotEmpty()
  @IsEnum(ResponseValueTypeEnum)
  responseValueType: ResponseValueTypeEnum;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  /** Valeur de responseValue pour laquelle responseValuePrecision est requise (ex. "YES"). */
  @IsOptional()
  responsePrecisionCondition?: string | number;

  @IsOptional()
  @IsString()
  precisionLabel?: string;

  @IsOptional()
  @IsEnum(ResponseValueTypeEnum)
  precisionValueType?: ResponseValueTypeEnum;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  precisionOptions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}
