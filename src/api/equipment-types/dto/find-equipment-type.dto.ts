import { IsOptional, IsString, IsNumber, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class FindEquipmentTypeDto {
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
  equipmentCategory?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
