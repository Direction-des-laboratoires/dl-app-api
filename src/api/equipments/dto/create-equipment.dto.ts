import {
  IsNotEmpty,
  IsMongoId,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import {
  EquipmentStatus,
  InventoryStatus,
  ReceptionStatus,
  AcquisitionModality,
  DonSource,
  DonSourceMshp,
  IntrantDispo,
  ContratMaintenance,
  ContratMaintenanceType,
} from '../schemas/equipment.schema';

export class CreateEquipmentDto {
  @IsOptional()
  @IsMongoId()
  lab?: string;

  @IsNotEmpty()
  @IsMongoId()
  equipmentType: string;

  @IsNotEmpty()
  @IsString()
  serialNumber: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsEnum(InventoryStatus)
  inventoryStatus?: InventoryStatus;

  @IsOptional()
  @IsEnum(ReceptionStatus)
  receptionStatus?: ReceptionStatus;

  @IsOptional()
  @IsMongoId()
  affectedTo?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: Date;

  @IsOptional()
  @IsDateString()
  receivedDate?: Date;

  @IsOptional()
  @IsDateString()
  commissioningDate?: Date;

  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: Date;

  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: Date;

  @IsOptional()
  @IsDateString()
  nextMaintenanceDate?: Date;

  @IsOptional()
  @IsDateString()
  lastCalibrationDate?: Date;

  @IsOptional()
  @IsDateString()
  nextCalibrationDate?: Date;

  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

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
  @IsString()
  donationSourcePrecision?: string;

  @IsOptional()
  @IsString()
  partnerDonationSourcePrecision?: string;

  @IsOptional()
  @IsString()
  mshpDonationSourcePrecision?: string;

  @IsOptional()
  @IsString()
  onLoanSupplier?: string;

  @IsOptional()
  @IsEnum(IntrantDispo)
  intrantDispo?: IntrantDispo;

  @IsOptional()
  @IsString()
  intrantNonRaison?: string;

  @IsOptional()
  @IsEnum(ContratMaintenance)
  contratMaintenance?: ContratMaintenance;

  @IsOptional()
  @IsEnum(ContratMaintenanceType)
  contratMaintenanceType?: ContratMaintenanceType;

  @IsOptional()
  @IsBoolean()
  maintenanceRequired?: boolean;

  @IsOptional()
  @IsDateString()
  firstUsedDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsMongoId()
  createdBy?: string;
}
