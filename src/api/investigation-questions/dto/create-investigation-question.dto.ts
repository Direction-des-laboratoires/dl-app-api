import { IsMongoId, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvestigationQuestionDto {
  @IsNotEmpty()
  @IsMongoId()
  investigation: string;

  @IsNotEmpty()
  @IsMongoId()
  question: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;
}
