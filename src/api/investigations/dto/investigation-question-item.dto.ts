import { IsMongoId, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class InvestigationQuestionItemDto {
  @IsNotEmpty()
  @IsMongoId()
  question: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;
}
