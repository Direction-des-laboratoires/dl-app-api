import { IsOptional, IsString, IsBoolean, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindEnvironmentPositionDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsMongoId()
  environment?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
