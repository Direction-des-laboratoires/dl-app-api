import { IsMongoId, IsOptional } from 'class-validator';

export class LabsStatsDto {
  @IsOptional()
  @IsMongoId()
  pole?: string;

  @IsOptional()
  @IsMongoId()
  region?: string;

  @IsOptional()
  @IsMongoId()
  district?: string;

  @IsOptional()
  @IsMongoId()
  type?: string;
}
