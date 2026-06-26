import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class FindInvestigationQuestionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
