import { IsOptional, IsString, IsNumberString, IsMongoId } from 'class-validator';

export class FindIntrantTypeDto {
  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  @IsNumberString()
  limit?: number;

  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

