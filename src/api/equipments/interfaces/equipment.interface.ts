import { Document } from 'mongoose';
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

export interface Equipment extends Document {
  lab: string;
  equipmentType: any;
  serialNumber: string;
  modelName?: string;
  brand?: string;
  status: EquipmentStatus;
  inventoryStatus: InventoryStatus;
  receptionStatus?: ReceptionStatus;
  affectedTo?: string;
  receivedBy?: string;
  receivedDate?: Date;
  commissioningDate?: Date;
  affectedToBy?: string;
  warrantyExpiryDate?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  lastCalibrationDate?: Date;
  nextCalibrationDate?: Date;
  isCritical?: boolean;
  acquisitionModality?: AcquisitionModality;
  donationSource?: DonSource;
  donationSourceMshp?: DonSourceMshp;
  donationSourcePrecision?: string;
  partnerDonationSourcePrecision?: string;
  mshpDonationSourcePrecision?: string;
  onLoanSupplier?: string;
  intrantDispo?: IntrantDispo;
  intrantNonRaison?: string;
  contratMaintenance?: ContratMaintenance;
  contratMaintenanceType?: ContratMaintenanceType;
  maintenanceRequired?: boolean;
  firstUsedDate?: Date;
  notes?: string;
  createdBy?: string;
  created_at: Date;
  updated_at: Date;
}
