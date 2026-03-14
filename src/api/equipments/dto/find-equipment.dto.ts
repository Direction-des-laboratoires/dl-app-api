import {
  IsOptional,
  IsString,
  IsNumber,
  IsMongoId,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EquipmentStatus,
  InventoryStatus,
  AcquisitionModality,
  DonSource,
  DonSourceMshp,
} from '../schemas/equipment.schema';

export class FindEquipmentDto {
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
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsEnum(InventoryStatus)
  inventoryStatus?: InventoryStatus;

  @IsOptional()
  @IsEnum(AcquisitionModality)
  acquisitionModality?: AcquisitionModality;

  @IsOptional()
  @IsEnum(DonSource)
  donationSource?: DonSource;

  @IsOptional()
  @IsEnum(DonSourceMshp)
  donationSourceMshp?: DonSourceMshp;

  @IsOptional()
  @IsMongoId()
  affectedTo?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
