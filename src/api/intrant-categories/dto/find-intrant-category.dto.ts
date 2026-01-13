import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class FindIntrantCategoryDto {
  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  @IsNumberString()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;
}

