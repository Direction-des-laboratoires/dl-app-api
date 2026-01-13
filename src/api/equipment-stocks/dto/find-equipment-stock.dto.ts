import { IsOptional, IsMongoId, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FindEquipmentStockDto {
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
  equipmentType?: string;

  @IsOptional()
  @IsMongoId()
  equipmentCategory?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
