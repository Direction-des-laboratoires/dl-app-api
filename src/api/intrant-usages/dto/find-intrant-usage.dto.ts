import { IsOptional, IsMongoId, IsString, IsNumberString, IsDateString } from 'class-validator';

export class FindIntrantUsageDto {
  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  @IsNumberString()
  limit?: number;

  @IsOptional()
  @IsMongoId()
  lab?: string;

  @IsOptional()
  @IsMongoId()
  intrant?: string;

  @IsOptional()
  @IsMongoId()
  usedBy?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

