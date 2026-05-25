import { IsMongoId, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class FindResponseDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsMongoId()
  lab?: string;

  @IsOptional()
  @IsMongoId()
  question?: string;
}
