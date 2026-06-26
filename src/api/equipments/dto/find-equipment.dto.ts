import {
  IsOptional,
  IsString,
  IsNumber,
  IsMongoId,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  EquipmentStatus,
  InventoryStatus,
  AcquisitionModality,
  DonSource,
  DonSourceMshp,
  IntrantDispo,
  ContratMaintenance,
  ContratMaintenanceType,
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
  @IsEnum(IntrantDispo)
  intrantDispo?: IntrantDispo;

  @IsOptional()
  @IsEnum(ContratMaintenance)
  contratMaintenance?: ContratMaintenance;

  @IsOptional()
  @IsEnum(ContratMaintenanceType)
  contratMaintenanceType?: ContratMaintenanceType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  maintenanceRequired?: boolean;

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
