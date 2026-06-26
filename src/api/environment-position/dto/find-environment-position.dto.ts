import { IsOptional, IsBoolean, IsMongoId, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindEnvironmentPositionDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsMongoId()
  environment?: string;

  @IsOptional()
  @IsMongoId()
  position?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
