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
  ) {}

  async create(
    createEquipmentDto: CreateEquipmentDto,
    userId?: string,
  ): Promise<Equipment> {
    try {
      logger.info(`---EQUIPMENTS.SERVICE.CREATE INIT---`);
      const { lab, equipmentType } = createEquipmentDto;

      const equipment = await this.equipmentModel.create({
        ...createEquipmentDto,
        createdBy: userId,
        affectedToBy: createEquipmentDto['affectedTo'] ? userId : null,
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

      logger.info(`---EQUIPMENTS.SERVICE.CREATE SUCCESS---`);
      return equipment;
    } catch (error) {
      logger.error(`---EQUIPMENTS.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message || "Erreur lors de la création de l'équipement",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
        filters.lab = user.lab.toString();
      }

      if (equipmentType) filters.equipmentType = equipmentType;
      if (status) filters.status = status;
      if (inventoryStatus) filters.inventoryStatus = inventoryStatus;
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
        const isLabAdminOfThisLab =
          user.role === Role.LabAdmin &&
          user.lab?.toString() === existing.lab.toString();

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

  async remove(id: string): Promise<Equipment> {
    try {
      logger.info(`---EQUIPMENTS.SERVICE.REMOVE INIT--- id=${id}`);
      const equipment = await this.equipmentModel.findById(id);
      if (!equipment) {
        throw new HttpException('Équipement non trouvé', HttpStatus.NOT_FOUND);
      }

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
