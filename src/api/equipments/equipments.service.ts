import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Equipment } from './interfaces/equipment.interface';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { FindEquipmentDto } from './dto/find-equipment.dto';
import { EquipmentStock } from '../equipment-stocks/interfaces/equipment-stock.interface';
import { EquipmentType } from '../equipment-types/interfaces/equipment-type.interface';
import { EquipmentStatus, InventoryStatus } from './schemas/equipment.schema';
import { OrderStatusEnum } from '../equipment-orders/schemas/equipment-order.schema';
import { Role } from 'src/utils/enums/roles.enum';
import { User } from '../user/interfaces/user.interface';
import logger from 'src/utils/logger';
import { buildStatisticsFilters } from 'src/utils/functions/filter-builder';
import { StatisticsFilterDto } from 'src/utils/dto/statistics-filter.dto';
import { EquipmentLifeEventsService } from '../equipment-life-events/equipment-life-events.service';
import { EquipmentLifeEventKind } from '../equipment-life-events/schemas/equipment-life-event.schema';

/** Champs suivis sur une mise à jour d’équipement (hors timestamps). */
const EQUIPMENT_UPDATE_TRACKED_FIELDS = [
  'lab',
  'equipmentType',
  'serialNumber',
  'modelName',
  'brand',
  'status',
  'inventoryStatus',
  'receptionStatus',
  'affectedTo',
  'affectedToBy',
  'receivedBy',
  'receivedDate',
  'purchaseDate',
  'commissioningDate',
  'warrantyExpiryDate',
  'lastMaintenanceDate',
  'nextMaintenanceDate',
  'lastCalibrationDate',
  'nextCalibrationDate',
  'isCritical',
  'acquisitionModality',
  'donationSource',
  'donationSourceMshp',
  'donationSourcePrecision',
  'partnerDonationSourcePrecision',
  'mshpDonationSourcePrecision',
  'onLoanSupplier',
  'intrantDispo',
  'intrantNonRaison',
  'contratMaintenance',
  'contratMaintenanceType',
  'maintenanceRequired',
  'firstUsedDate',
  'notes',
] as const;

const EQUIPMENT_REF_FIELDS = new Set<string>([
  'lab',
  'equipmentType',
  'affectedTo',
  'affectedToBy',
  'receivedBy',
  'createdBy',
]);

@Injectable()
export class EquipmentsService {
  constructor(
    @InjectModel('Equipment') private equipmentModel: Model<Equipment>,
    @InjectModel('EquipmentStock')
    private equipmentStockModel: Model<EquipmentStock>,
    @InjectModel('EquipmentType')
    private equipmentTypeModel: Model<EquipmentType>,
    @InjectModel('EquipmentOrder') private equipmentOrderModel: Model<any>,
    @InjectModel('Lab') private labModel: Model<any>,
    @InjectModel('Structure') private structureModel: Model<any>,
    private equipmentLifeEventsService: EquipmentLifeEventsService,
  ) {}

  private getEquipmentFieldRaw(doc: any, field: string): unknown {
    const v = doc?.[field];
    if (v == null) {
      return null;
    }
    if (
      EQUIPMENT_REF_FIELDS.has(field) &&
      typeof v === 'object' &&
      v !== null &&
      '_id' in v
    ) {
      return (v as { _id: unknown })._id;
    }
    return v;
  }

  private normalizeEquipmentFieldValue(val: unknown): string {
    if (val == null) {
      return '';
    }
    if (val instanceof Date) {
      return val.toISOString();
    }
    return String(val);
  }

  /**
   * Journalise les changements réels entre l’état avant/après update (évite les faux positifs si le DTO ne contient pas un champ).
   */
  private async recordLifeEventsForEquipmentUpdate(
    existing: Equipment,
    updated: Equipment,
    user?: any,
  ): Promise<void> {
    const equipmentId = String(updated._id);
    const actorId = user?._id?.toString();

    const changes: Record<string, { from: string; to: string }> = {};
    for (const field of EQUIPMENT_UPDATE_TRACKED_FIELDS) {
      const from = this.normalizeEquipmentFieldValue(
        this.getEquipmentFieldRaw(existing, field),
      );
      const to = this.normalizeEquipmentFieldValue(
        this.getEquipmentFieldRaw(updated, field),
      );
      if (from !== to) {
        changes[field] = { from, to };
      }
    }

    if (changes.status) {
      await this.equipmentLifeEventsService.tryRecordEvent({
        equipmentId,
        kind: EquipmentLifeEventKind.EQUIPMENT_STATUS_CHANGED,
        previousValue: changes.status.from,
        newValue: changes.status.to,
        summary: `Statut opérationnel : ${changes.status.from || '—'} → ${changes.status.to}`,
        actorId,
      });
      delete changes.status;
    }

    if (changes.inventoryStatus) {
      await this.equipmentLifeEventsService.tryRecordEvent({
        equipmentId,
        kind: EquipmentLifeEventKind.EQUIPMENT_INVENTORY_STATUS_CHANGED,
        previousValue: changes.inventoryStatus.from,
        newValue: changes.inventoryStatus.to,
        summary: `Statut d’inventaire : ${changes.inventoryStatus.from || '—'} → ${changes.inventoryStatus.to}`,
        actorId,
      });
      delete changes.inventoryStatus;
    }

    if (changes.receptionStatus) {
      await this.equipmentLifeEventsService.tryRecordEvent({
        equipmentId,
        kind: EquipmentLifeEventKind.EQUIPMENT_RECEPTION_STATUS_CHANGED,
        previousValue: changes.receptionStatus.from,
        newValue: changes.receptionStatus.to,
        summary: `Statut de réception : ${changes.receptionStatus.from || '—'} → ${changes.receptionStatus.to}`,
        actorId,
      });
      delete changes.receptionStatus;
    }

    const rest = Object.keys(changes);
    if (rest.length === 0) {
      return;
    }

    let payload = JSON.stringify(changes);
    const maxLen = 2000;
    if (payload.length > maxLen) {
      payload = `${payload.slice(0, maxLen)}…`;
    }

    await this.equipmentLifeEventsService.tryRecordEvent({
      equipmentId,
      kind: EquipmentLifeEventKind.EQUIPMENT_DETAILS_UPDATED,
      newValue: payload,
      summary: `Mise à jour de la fiche : ${rest.join(', ')}`,
      actorId,
    });
  }

  async create(
    createEquipmentDto: CreateEquipmentDto,
    user?: User,
  ): Promise<Equipment> {
    try {
      return await this.persistNewEquipment(createEquipmentDto, user);
    } catch (error) {
      logger.error(`---EQUIPMENTS.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message || "Erreur lors de la création de l'équipement",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Création en lot : continue malgré les lignes en erreur (ex. n° série dupliqué).
   */
  async createBulk(
    items: CreateEquipmentDto[],
    user?: User,
  ): Promise<{
    successCount: number;
    failedCount: number;
    totalCount: number;
    created: Equipment[];
    errors: { index: number; serialNumber?: string; message: string }[];
  }> {
    const created: Equipment[] = [];
    const errors: { index: number; serialNumber?: string; message: string }[] =
      [];
    for (let i = 0; i < items.length; i++) {
      try {
        const equipment = await this.persistNewEquipment(items[i], user);
        created.push(equipment);
      } catch (error: any) {
        const raw =
          error?.response?.message ?? error?.message ?? 'Erreur inconnue';
        const message = Array.isArray(raw) ? raw.join('; ') : String(raw);
        logger.error(
          `---EQUIPMENTS.SERVICE.CREATE_BULK ITEM ${i} ERROR ${message}---`,
        );
        errors.push({
          index: i,
          serialNumber: items[i]?.serialNumber,
          message,
        });
      }
    }
    return {
      successCount: created.length,
      failedCount: errors.length,
      totalCount: items.length,
      created,
      errors,
    };
  }

  private async persistNewEquipment(
    createEquipmentDto: CreateEquipmentDto,
    user?: User,
  ): Promise<Equipment> {
    logger.info(`---EQUIPMENTS.SERVICE.CREATE INIT---`);

    const userId = user?._id?.toString();
    const payload: CreateEquipmentDto = { ...createEquipmentDto };

    if (user?.role === Role.LabAdmin) {
      const labRef = user.lab as any;
      const labId =
        labRef?._id != null
          ? String(labRef._id)
          : labRef != null
            ? String(labRef)
            : '';
      if (!labId) {
        throw new HttpException(
          'Laboratoire non défini pour cet administrateur de laboratoire',
          HttpStatus.BAD_REQUEST,
        );
      }
      payload.lab = labId;
    }

    const equipment = await this.equipmentModel.create({
      ...payload,
      createdBy: userId,
      affectedToBy: payload['affectedTo'] ? userId : null,
    });

    await equipment.populate('lab', 'name');
    await equipment.populate('equipmentType', 'name');
    await equipment.populate(
      'createdBy',
      'firstname lastname phoneNumber email',
    );
    await equipment.populate(
      'affectedTo',
      'firstname lastname phoneNumber email',
    );

    await this.equipmentLifeEventsService.tryRecordEvent({
      equipmentId: equipment._id.toString(),
      kind: EquipmentLifeEventKind.EQUIPMENT_CREATED,
      newValue: `${equipment.status}|${equipment.inventoryStatus}`,
      summary: `Équipement créé — statut ${equipment.status}, inventaire ${equipment.inventoryStatus}`,
      actorId: userId,
    });

    logger.info(`---EQUIPMENTS.SERVICE.CREATE SUCCESS---`);
    return equipment;
  }

  async findAll(query: FindEquipmentDto, user?: User): Promise<any> {
    try {
      logger.info(`---EQUIPMENTS.SERVICE.FIND_ALL INIT---`);
      const {
        page = 1,
        limit = 10,
        lab,
        equipmentType,
        equipmentCategory,
        status,
        inventoryStatus,
        acquisitionModality,
        donationSource,
        donationSourceMshp,
        intrantDispo,
        contratMaintenance,
        contratMaintenanceType,
        maintenanceRequired,
        affectedTo,
        brand,
        modelName,
        search,
      } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (lab) filters.lab = lab;

      // Filtre par labo si non SuperAdmin
      if (user && user.role !== Role.SuperAdmin) {
        const labId = user.lab?._id?.toString() || user.lab?.toString();
        if (labId) filters.lab = labId;
      }

      if (equipmentType) filters.equipmentType = equipmentType;
      if (status) filters.status = status;
      if (inventoryStatus) filters.inventoryStatus = inventoryStatus;
      if (acquisitionModality) filters.acquisitionModality = acquisitionModality;
      if (donationSource) filters.donationSource = donationSource;
      if (donationSourceMshp) filters.donationSourceMshp = donationSourceMshp;
      if (intrantDispo) filters.intrantDispo = intrantDispo;
      if (contratMaintenance) filters.contratMaintenance = contratMaintenance;
      if (contratMaintenanceType)
        filters.contratMaintenanceType = contratMaintenanceType;
      if (maintenanceRequired !== undefined)
        filters.maintenanceRequired = maintenanceRequired;
      if (affectedTo) filters.affectedTo = affectedTo;
      if (brand) filters.brand = { $regex: brand, $options: 'i' };
      if (modelName) filters.modelName = { $regex: modelName, $options: 'i' };

      // Filtrer par catégorie d'équipement
      if (equipmentCategory) {
        const equipmentTypes = await this.equipmentTypeModel
          .find({ equipmentCategory })
          .select('_id')
          .lean();
        const equipmentTypeIds = equipmentTypes.map((e) => e._id);
        filters.equipmentType = { $in: equipmentTypeIds };
      }

      if (search) {
        const [typeIds, labIds] = await Promise.all([
          this.equipmentTypeModel
            .find({ name: { $regex: search, $options: 'i' } })
            .select('_id')
            .lean(),
          this.labModel
            .find({ name: { $regex: search, $options: 'i' } })
            .select('_id')
            .lean(),
        ]);

        filters.$or = [
          { serialNumber: { $regex: search, $options: 'i' } },
          { modelName: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
          { equipmentType: { $in: typeIds.map((t) => t._id) } },
          { lab: { $in: labIds.map((l) => l._id) } },
        ];
      }

      const [data, total] = await Promise.all([
        this.equipmentModel
          .find(filters)
          .populate('lab', 'name')
          .populate('createdBy', 'firstname lastname phoneNumber email')
          .populate('affectedTo', 'firstname lastname phoneNumber email')
          .populate('affectedToBy', 'firstname lastname phoneNumber email')
          .populate('receivedBy', 'firstname lastname phoneNumber email')
          .populate({
            path: 'equipmentType',
            select: 'name equipmentCategory',
            populate: {
              path: 'equipmentCategory',
              select: 'name',
            },
          })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.equipmentModel.countDocuments(filters).exec(),
      ]);

      logger.info(`---EQUIPMENTS.SERVICE.FIND_ALL SUCCESS---`);
      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`---EQUIPMENTS.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<Equipment> {
    try {
      logger.info(`---EQUIPMENTS.SERVICE.FIND_ONE INIT--- id=${id}`);
      const equipment = await this.equipmentModel
        .findById(id)
        .populate('lab', 'name')
        .populate('createdBy', 'firstname lastname phoneNumber email')
        .populate('affectedTo', 'firstname lastname phoneNumber email')
        .populate('affectedToBy', 'firstname lastname phoneNumber email')
        .populate('receivedBy', 'firstname lastname phoneNumber email')
        .populate({
          path: 'equipmentType',
          select: 'name equipmentCategory',
          populate: {
            path: 'equipmentCategory',
            select: 'name',
          },
        })
        .exec();

      if (!equipment) {
        throw new HttpException('Équipement non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---EQUIPMENTS.SERVICE.FIND_ONE SUCCESS--- id=${id}`);
      return equipment;
    } catch (error) {
      logger.error(`---EQUIPMENTS.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateEquipmentDto: UpdateEquipmentDto,
    user?: any,
  ): Promise<Equipment> {
    try {
      logger.info(`---EQUIPMENTS.SERVICE.UPDATE INIT--- id=${id}`);

      const existing = await this.equipmentModel.findById(id);
      if (!existing) {
        throw new HttpException('Équipement non trouvé', HttpStatus.NOT_FOUND);
      }

      // Restriction sur affectedTo
      if (
        updateEquipmentDto.affectedTo &&
        updateEquipmentDto.affectedTo.toString() !==
          (existing.affectedTo ? existing.affectedTo.toString() : null)
      ) {
        if (!user) {
          throw new HttpException('Non autorisé', HttpStatus.UNAUTHORIZED);
        }

        const isSuperAdmin = user.role === Role.SuperAdmin;
        const userLabId = user.lab?._id?.toString() || user.lab?.toString();
        const isLabAdminOfThisLab =
          user.role === Role.LabAdmin &&
          userLabId === existing.lab?.toString();

        if (!isSuperAdmin && !isLabAdminOfThisLab) {
          throw new HttpException(
            "Seul un Super Admin ou l'Admin de ce laboratoire peut modifier l'affectation",
            HttpStatus.FORBIDDEN,
          );
        }

        // Si autorisé, on enregistre qui a fait l'affectation
        updateEquipmentDto.affectedToBy = user._id;
      }

      const updated = await this.equipmentModel
        .findByIdAndUpdate(
          id,
          { ...updateEquipmentDto, updated_at: new Date() },
          { new: true },
        )
        .populate('lab', 'name')
        .populate('createdBy', 'firstname lastname phoneNumber email')
        .populate('affectedTo', 'firstname lastname phoneNumber email')
        .populate('affectedToBy', 'firstname lastname phoneNumber email')
        .populate('receivedBy', 'firstname lastname phoneNumber email')
        .populate({
          path: 'equipmentType',
          select: 'name equipmentCategory',
          populate: {
            path: 'equipmentCategory',
            select: 'name',
          },
        })
        .exec();

      if (updated) {
        await this.recordLifeEventsForEquipmentUpdate(
          existing,
          updated,
          user,
        );
      }

      logger.info(`---EQUIPMENTS.SERVICE.UPDATE SUCCESS--- id=${id}`);
      return updated;
    } catch (error) {
      logger.error(`---EQUIPMENTS.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string, actorId?: string): Promise<Equipment> {
    try {
      logger.info(`---EQUIPMENTS.SERVICE.REMOVE INIT--- id=${id}`);
      const equipment = await this.equipmentModel.findById(id);
      if (!equipment) {
        throw new HttpException('Équipement non trouvé', HttpStatus.NOT_FOUND);
      }

      await this.equipmentLifeEventsService.tryRecordEvent({
        equipmentId: id,
        kind: EquipmentLifeEventKind.EQUIPMENT_REMOVED,
        summary: equipment.serialNumber
          ? `Équipement supprimé (n° série ${equipment.serialNumber})`
          : 'Équipement supprimé',
        actorId,
      });

      const deleted = await this.equipmentModel.findByIdAndDelete(id).exec();

      // Mettre à jour le stock (décrémenter usedQuantity)
      const stock = await this.equipmentStockModel.findOne({
        lab: equipment.lab,
        equipmentType: equipment.equipmentType,
      });
      if (stock) {
        stock.usedQuantity -= 1;
        if (stock.usedQuantity < 0) stock.usedQuantity = 0;
        await stock.save();
      }

      logger.info(`---EQUIPMENTS.SERVICE.REMOVE SUCCESS--- id=${id}`);
      return deleted;
    } catch (error) {
      logger.error(`---EQUIPMENTS.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async receive(
    id: string,
    userId: string,
    receivedDate?: Date,
  ): Promise<Equipment> {
    try {
      logger.info(`---EQUIPMENTS.SERVICE.RECEIVE INIT--- id=${id}`);
      const equipment = await this.equipmentModel.findById(id);

      if (!equipment) {
        throw new HttpException('Équipement non trouvé', HttpStatus.NOT_FOUND);
      }

      if (equipment.inventoryStatus !== InventoryStatus.IN_DELIVERY) {
        throw new HttpException(
          "L'équipement n'est pas en cours de livraison",
          HttpStatus.BAD_REQUEST,
        );
      }

      equipment.inventoryStatus = InventoryStatus.AVAILABLE;
      equipment.receivedBy = userId as any;
      equipment.receivedDate = receivedDate
        ? new Date(receivedDate)
        : new Date();
      equipment.updated_at = new Date();

      const updated = await equipment.save();
      await updated.populate(
        'receivedBy',
        'firstname lastname phoneNumber email',
      );

      await this.equipmentLifeEventsService.tryRecordEvent({
        equipmentId: id,
        kind: EquipmentLifeEventKind.EQUIPMENT_RECEIVED,
        previousValue: InventoryStatus.IN_DELIVERY,
        newValue: InventoryStatus.AVAILABLE,
        summary: 'Réception : passage en disponible',
        actorId: userId,
      });

      logger.info(`---EQUIPMENTS.SERVICE.RECEIVE SUCCESS--- id=${id}`);
      return updated;
    } catch (error) {
      logger.error(`---EQUIPMENTS.SERVICE.RECEIVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getStatistics(user: any, query: StatisticsFilterDto): Promise<any> {
    try {
      logger.info(`---EQUIPMENTS.SERVICE.GET_STATISTICS INIT---`);
      const filters = await buildStatisticsFilters(
        user,
        query,
        this.labModel,
        this.structureModel,
      );

      const [total, byStatus, byInventoryStatus, byCategory, ordersByStatus] =
        await Promise.all([
          this.equipmentModel.countDocuments(filters),
          this.equipmentModel.aggregate([
            { $match: filters },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]),
          this.equipmentModel.aggregate([
            { $match: filters },
            { $group: { _id: '$inventoryStatus', count: { $sum: 1 } } },
          ]),
          this.equipmentModel.aggregate([
            { $match: filters },
            {
              $lookup: {
                from: 'equipmenttypes',
                localField: 'equipmentType',
                foreignField: '_id',
                as: 'type',
              },
            },
            { $unwind: '$type' },
            {
              $lookup: {
                from: 'equipmentcategories',
                localField: 'type.equipmentCategory',
                foreignField: '_id',
                as: 'category',
              },
            },
            { $unwind: '$category' },
            { $group: { _id: '$category.name', count: { $sum: 1 } } },
          ]),
          this.equipmentOrderModel.aggregate([
            { $match: filters },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]),
        ]);

      logger.info(`---EQUIPMENTS.SERVICE.GET_STATISTICS SUCCESS---`);
      return {
        total,
        byStatus: Object.values(EquipmentStatus).reduce((acc: any, status) => {
          const found = byStatus.find((s) => s._id === status);
          acc[status] = found ? found.count : 0;
          return acc;
        }, {}),
        byInventoryStatus: Object.values(InventoryStatus).reduce(
          (acc: any, status) => {
            const found = byInventoryStatus.find((s) => s._id === status);
            acc[status] = found ? found.count : 0;
            return acc;
          },
          {},
        ),
        byCategory: byCategory.reduce((acc: any, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        ordersByStatus: Object.values(OrderStatusEnum).reduce(
          (acc: any, status) => {
            const found = ordersByStatus.find((s) => s._id === status);
            acc[status] = found ? found.count : 0;
            return acc;
          },
          {},
        ),
      };
    } catch (error) {
      logger.error(`---EQUIPMENTS.SERVICE.GET_STATISTICS ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
