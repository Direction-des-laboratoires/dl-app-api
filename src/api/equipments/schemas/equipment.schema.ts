import * as mongoose from 'mongoose';

export enum EquipmentStatus {
  OPERATIONAL = 'operational',
  //BROKEN = 'broken',
  MAINTENANCE = 'maintenance',
  OUT_OF_ORDER = 'out_of_order',
}

export enum InventoryStatus {
  IN_DELIVERY = 'in_delivery',
  AVAILABLE = 'available',
  IN_STOCK = 'in_stock',
  IN_USE = 'in_use',
  RETIRED = 'retired',
}

export enum ReceptionStatus {
  GOOD = 'good',
  DAMAGED = 'damaged',
}

export enum AcquisitionModality {
  ACHAT_DIRECT = 'achat_direct',
  DON = 'don',
  MISE_A_DISPOSITION = 'mise_a_disposition',
  INCONNU = 'inconnu',
}

/** Source du don (niveau 1) : MSHP, Partenaire, ONG, etc. */
export enum DonSource {
  MSHP = 'MSHP',
  PARTENAIRE = 'PARTENAIRE',
  ONG = 'ONG',
  PARTICULIER = 'PARTICULIER',
  ASSOCIATION = 'ASSOCIATION',
  INDUSTRIE = 'INDUSTRIE',
  AUTRES = 'AUTRES',
}

/** Entité MSHP (niveau 2) : pertinent uniquement si donationSource = MSHP */
export enum DonSourceMshp {
  DL = 'DL',
  DEM = 'DEM',
  PNLP = 'PNLP',
  DLSI = 'DLSI',
  CNLS = 'CNLS',
  DSME = 'DSME',
  AUTRES = 'AUTRES',
}

/** Intrant disponible : Oui, Non, Non applicable */
export enum IntrantDispo {
  YES = 'yes',
  NO = 'no',
  NA = 'na',
}

/** Contrat de maintenance : Oui, Non */
export enum ContratMaintenance {
  YES = 'yes',
  NO = 'no',
}

/** Type de contrat de maintenance : pertinent si contratMaintenance = yes */
export enum ContratMaintenanceType {
  MAINTENANCE_PIECE_MDO = 'maintenance_piece_mdo', // maintenance piece et main d'oeuvre
  MAINTENANCE_ANNUELLE = 'maintenance_annuelle',
}

export const EquipmentSchema = new mongoose.Schema({
  lab: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lab',
    default: null,
  },
  equipmentType: {
    type: mongoose.Schema.ObjectId,
    ref: 'EquipmentType',
    required: true,
  },
  serialNumber: {
    type: String,
    unique: true,
    default: null,
  },
  modelName: {
    type: String,
  },
  brand: {
    type: String,
  },
  status: {
    type: String,
    enum: Object.values(EquipmentStatus),
    default: EquipmentStatus.OPERATIONAL,
  },
  inventoryStatus: {
    type: String,
    enum: Object.values(InventoryStatus),
    default: InventoryStatus.IN_DELIVERY,
  },
  receptionStatus: {
    type: String,
    enum: Object.values(ReceptionStatus),
    default: ReceptionStatus.GOOD,
  },
  affectedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  receivedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  receivedDate: {
    type: Date,
    default: null,
  },
  affectedToBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  purchaseDate: {
    type: Date,
  },
  commissioningDate: {
    type: Date,
    default: null,
  },
  warrantyExpiryDate: {
    type: Date,
  },
  lastMaintenanceDate: {
    type: Date,
  },
  nextMaintenanceDate: {
    type: Date,
  },
  lastCalibrationDate: {
    type: Date,
    default: null,
  },
  nextCalibrationDate: {
    type: Date,
    default: null,
  },
  isCritical: {
    type: Boolean,
    default: false,
  },
  acquisitionModality: {
    type: String,
    enum: Object.values(AcquisitionModality),
    default: null,
  },
  donationSource: {
    type: String,
    enum: Object.values(DonSource),
    default: null,
  },
  donationSourceMshp: {
    type: String,
    enum: Object.values(DonSourceMshp),
    default: null,
  },
  donationSourcePrecision: {
    type: String,
    default: null,
  },
  partnerDonationSourcePrecision: {
    type: String,
    default: null,
  },
  mshpDonationSourcePrecision: {
    type: String,
    default: null,
  },
  onLoanSupplier: {
    type: String,
    default: null,
  },
  intrantDispo: {
    type: String,
    enum: Object.values(IntrantDispo),
    default: null,
  },
  intrantNonRaison: {
    type: String,
    default: null,
  },
  contratMaintenance: {
    type: String,
    enum: Object.values(ContratMaintenance),
    default: null,
  },
  contratMaintenanceType: {
    type: String,
    enum: Object.values(ContratMaintenanceType),
    default: null,
  },
  maintenanceRequired: {
    type: Boolean,
    default: null,
  },
  firstUsedDate: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

EquipmentSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
