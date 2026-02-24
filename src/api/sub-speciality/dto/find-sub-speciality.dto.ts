import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindSubSpecialityDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
