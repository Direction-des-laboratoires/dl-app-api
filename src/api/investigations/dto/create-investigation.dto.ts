import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvestigationQuestionItemDto } from './investigation-question-item.dto';
import { InvestigationStatusEnum } from 'src/utils/enums/investigation-status.enum';
import { InvestigationType } from 'src/utils/enums/investigation-type.enum';

export class CreateInvestigationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsEnum(InvestigationType)
  type?: InvestigationType;

  @IsOptional()
  @IsEnum(InvestigationStatusEnum)
  status?: InvestigationStatusEnum;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvestigationQuestionItemDto)
  questions?: InvestigationQuestionItemDto[];
}
