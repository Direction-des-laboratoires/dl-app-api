import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EquipmentOrder } from './interfaces/equipment-order.interface';
import { CreateEquipmentOrderDto } from './dto/create-equipment-order.dto';
import { FindEquipmentOrderDto } from './dto/find-equipment-order.dto';
import logger from 'src/utils/logger';
import { UpdateEquipmentOrderDto } from './dto/update-equipment-order.dto';
import { OrderStatusEnum } from './schemas/equipment-order.schema';
import { EquipmentStocksService } from '../equipment-stocks/equipment-stocks.service';
import { User } from '../user/interfaces/user.interface';
import { Role } from 'src/utils/enums/roles.enum';
import { EquipmentsService } from '../equipments/equipments.service';
import { InventoryStatus } from '../equipments/schemas/equipment.schema';
import { generateBatchNumber } from 'src/utils/functions/code_generation';
import { buildStatisticsFilters } from 'src/utils/functions/filter-builder';
import { StatisticsFilterDto } from 'src/utils/dto/statistics-filter.dto';

@Injectable()
export class EquipmentOrdersService {
  constructor(
    @InjectModel('EquipmentOrder')
    private equipmentOrderModel: Model<EquipmentOrder>,
    @InjectModel('EquipmentType') private equipmentTypeModel: Model<any>,
    @InjectModel('Lab') private labModel: Model<any>,
    @InjectModel('Supplier') private supplierModel: Model<any>,
    @InjectModel('Structure') private structureModel: Model<any>,
    private equipmentStocksService: EquipmentStocksService,
    private equipmentsService: EquipmentsService,
  ) {}

  async create(
    createEquipmentOrderDto: CreateEquipmentOrderDto,
    user?: User,
  ): Promise<EquipmentOrder> {
    try {
      logger.info(`---EQUIPMENT_ORDERS.SERVICE.CREATE INIT---`);

      // Logique de labo
      if (user && user.role !== Role.SuperAdmin) {
        createEquipmentOrderDto.lab = user.lab.toString();
      }

      // Calcul du prix total
      const totalPrice = createEquipmentOrderDto.cart.reduce((acc, item) => {
        return acc + item.purchasePrice * item.quantity;
      }, 0);

      const order = await this.equipmentOrderModel.create({
        ...createEquipmentOrderDto,
        totalPrice,
      });

      // Si le statut est COMPLETED à la création, on met à jour le stock et on crée les équipements
      if (order.status === OrderStatusEnum.COMPLETED && order.lab) {
        for (const item of order.cart) {
          await this.equipmentStocksService.updateQuantity(
            order.lab.toString(),
            item.equipmentType.toString(),
            item.quantity,
            item.unit,
            order._id.toString(),
            item.brand,
            item.modelName,
          );
        }
        await this.createEquipmentsFromOrder(order, user?._id?.toString());
      }

      await order.populate('lab', 'name');
      await order.populate('supplier', 'name');
      await order.populate('cart.equipmentType', 'name');
      await order.populate(
        'validatedBy',
        'firstname lastname phoneNumber email',
      );
      await order.populate(
        'completedBy',
        'firstname lastname phoneNumber email',
      );
      logger.info(`---EQUIPMENT_ORDERS.SERVICE.CREATE SUCCESS---`);
      return order;
    } catch (error) {
      logger.error(`---EQUIPMENT_ORDERS.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la création de la commande',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindEquipmentOrderDto, user?: User): Promise<any> {
    try {
      logger.info(`---EQUIPMENT_ORDERS.SERVICE.FIND_ALL INIT---`);
      const {
        page = 1,
        limit = 10,
        search,
        supplier,
        equipmentType,
        equipmentCategory,
        lab,
        status,
        validatedBy,
        completedBy,
      } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (supplier) filters.supplier = supplier;
      if (equipmentType) filters['cart.equipmentType'] = equipmentType;
      if (lab) filters.lab = lab;

      // Filtre par labo si non SuperAdmin
      if (user && user.role !== Role.SuperAdmin) {
        filters.lab = user.lab.toString();
      }

      if (status) filters.status = status;
      if (validatedBy) filters.validatedBy = validatedBy;
      if (completedBy) filters.completedBy = completedBy;

      // Filtrer par catégorie d'équipement
      if (equipmentCategory) {
        const equipmentTypes = await this.equipmentTypeModel
          .find({ equipmentCategory })
          .select('_id')
          .lean();
        const equipmentTypeIds = equipmentTypes.map((e) => e._id);
        filters['cart.equipmentType'] = { $in: equipmentTypeIds };
      }

      if (search) {
        const [typeIds, labIds, supplierIds] = await Promise.all([
          this.equipmentTypeModel
            .find({ name: { $regex: search, $options: 'i' } })
            .select('_id')
            .lean(),
          this.labModel
            .find({ name: { $regex: search, $options: 'i' } })
            .select('_id')
            .lean(),
          this.supplierModel
            .find({ name: { $regex: search, $options: 'i' } })
            .select('_id')
            .lean(),
        ]);

        filters.$or = [
          { notes: { $regex: search, $options: 'i' } },
          { 'cart.description': { $regex: search, $options: 'i' } },
          { 'cart.brand': { $regex: search, $options: 'i' } },
          { 'cart.equipmentType': { $in: typeIds.map((t) => t._id) } },
          { lab: { $in: labIds.map((l) => l._id) } },
          { supplier: { $in: supplierIds.map((s) => s._id) } },
        ];
      }

      const [data, total] = await Promise.all([
        this.equipmentOrderModel
          .find(filters)
          .populate('lab', 'name')
          .populate('supplier', 'name email phoneNumber')
          .populate('cart.equipmentType', 'name')
          .populate('validatedBy', 'firstname lastname phoneNumber email')
          .populate('completedBy', 'firstname lastname phoneNumber email')
          .sort({ purchaseDate: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.equipmentOrderModel.countDocuments(filters).exec(),
      ]);

      logger.info(`---EQUIPMENT_ORDERS.SERVICE.FIND_ALL SUCCESS---`);
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
      logger.error(`---EQUIPMENT_ORDERS.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      logger.info(`---EQUIPMENT_ORDERS.SERVICE.FIND_ONE INIT--- id=${id}`);
      const order = await this.equipmentOrderModel
        .findById(id)
        .populate('lab', 'name')
        .populate('supplier', 'name email phoneNumber address')
        .populate('cart.equipmentType', 'name')
        .populate('validatedBy', 'firstname lastname phoneNumber email')
        .populate('completedBy', 'firstname lastname phoneNumber email')
        .lean();

      if (!order) {
        throw new HttpException('Commande non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---EQUIPMENT_ORDERS.SERVICE.FIND_ONE SUCCESS--- id=${id}`);
      return order;
    } catch (error) {
      logger.error(`---EQUIPMENT_ORDERS.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateEquipmentOrderDto: UpdateEquipmentOrderDto,
    user?: User,
  ): Promise<any> {
    try {
      logger.info(`---EQUIPMENT_ORDERS.SERVICE.UPDATE INIT--- id=${id}`);

      // Récupérer la commande actuelle pour comparer le statut
      const currentOrder = await this.equipmentOrderModel.findById(id);
      if (!currentOrder) {
        throw new HttpException('Commande non trouvée', HttpStatus.NOT_FOUND);
      }

      if (currentOrder.status === OrderStatusEnum.COMPLETED) {
        throw new HttpException(
          'Une commande déjà complétée ne peut plus être modifiée',
          HttpStatus.BAD_REQUEST,
        );
      }

      const oldStatus = currentOrder.status;
      const newStatus = updateEquipmentOrderDto.status;

      const updateData: any = {
        ...updateEquipmentOrderDto,
        updated_at: new Date(),
      };

      // Recalculer le prix total si le panier est présent dans l'update
      if (updateEquipmentOrderDto.cart) {
        updateData.totalPrice = updateEquipmentOrderDto.cart.reduce(
          (acc, item) => {
            return acc + item.purchasePrice * item.quantity;
          },
          0,
        );
      }

      if (user) {
        if (
          newStatus === OrderStatusEnum.VALIDATED &&
          oldStatus !== OrderStatusEnum.VALIDATED
        ) {
          updateData.validatedBy = user._id;
        }

        if (newStatus === OrderStatusEnum.COMPLETED) {
          updateData.completedBy = user._id;
        }
      }

      const updated = await this.equipmentOrderModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('lab', 'name')
        .populate('supplier', 'name')
        .populate('cart.equipmentType', 'name')
        .populate('validatedBy', 'firstname lastname phoneNumber email')
        .populate('completedBy', 'firstname lastname phoneNumber email')
        .lean();

      // Si le statut passe à COMPLETED, on augmente le stock du labo pour chaque article et on crée les équipements
      if (newStatus === OrderStatusEnum.COMPLETED) {
        logger.info(
          `---EQUIPMENT_ORDERS.SERVICE.UPDATE STATUS COMPLETED--- updating stock and creating equipments`,
        );

        if (currentOrder.lab) {
          for (const item of currentOrder.cart) {
            await this.equipmentStocksService.updateQuantity(
              currentOrder.lab.toString(),
              item.equipmentType.toString(),
              item.quantity,
              item.unit,
              currentOrder._id.toString(),
              item.brand,
              item.modelName,
            );
          }
          await this.createEquipmentsFromOrder(updated, user?._id?.toString());
        }
      }

      logger.info(`---EQUIPMENT_ORDERS.SERVICE.UPDATE SUCCESS--- id=${id}`);
      return updated;
    } catch (error) {
      logger.error(`---EQUIPMENT_ORDERS.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<EquipmentOrder> {
    try {
      logger.info(`---EQUIPMENT_ORDERS.SERVICE.REMOVE INIT--- id=${id}`);
      const order = await this.equipmentOrderModel.findById(id);
      if (!order) {
        throw new HttpException('Commande non trouvée', HttpStatus.NOT_FOUND);
      }

      const deleted = await this.equipmentOrderModel
        .findByIdAndDelete(id)
        .exec();

      // Si la commande était COMPLETED, on décrémente le stock du labo pour chaque article
      if (order.status === OrderStatusEnum.COMPLETED && order.lab) {
        for (const item of order.cart) {
          await this.equipmentStocksService.updateQuantity(
            order.lab.toString(),
            item.equipmentType.toString(),
            -item.quantity,
            item.unit,
          );
        }
      }

      logger.info(`---EQUIPMENT_ORDERS.SERVICE.REMOVE SUCCESS--- id=${id}`);
      return deleted as unknown as EquipmentOrder;
    } catch (error) {
      logger.error(`---EQUIPMENT_ORDERS.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getStatistics(user: User, query: StatisticsFilterDto): Promise<any> {
    try {
      logger.info(`---EQUIPMENT_ORDERS.SERVICE.GET_STATISTICS INIT---`);
      const filters = await buildStatisticsFilters(
        user,
        query,
        this.labModel,
        this.structureModel,
        'purchaseDate',
      );

      const [totalOrders, totalAmount, byStatus, itemsStats] =
        await Promise.all([
          this.equipmentOrderModel.countDocuments(filters),
          this.equipmentOrderModel.aggregate([
            { $match: filters },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } },
          ]),
          this.equipmentOrderModel.aggregate([
            { $match: filters },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]),
          this.equipmentOrderModel.aggregate([
            { $match: filters },
            { $unwind: '$cart' },
            {
              $group: {
                _id: null,
                totalItems: { $sum: '$cart.quantity' },
                uniqueEquipmentTypes: { $addToSet: '$cart.equipmentType' },
              },
            },
          ]),
        ]);

      logger.info(`---EQUIPMENT_ORDERS.SERVICE.GET_STATISTICS SUCCESS---`);
      return {
        totalOrders,
        totalAmount: totalAmount[0]?.total || 0,
        byStatus: Object.values(OrderStatusEnum).reduce((acc: any, status) => {
          const found = byStatus.find((s) => s._id === status);
          acc[status] = found ? found.count : 0;
          return acc;
        }, {}),
        totalItemsOrdered: itemsStats[0]?.totalItems || 0,
        uniqueEquipmentTypesCount:
          itemsStats[0]?.uniqueEquipmentTypes?.length || 0,
      };
    } catch (error) {
      logger.error(
        `---EQUIPMENT_ORDERS.SERVICE.GET_STATISTICS ERROR ${error}---`,
      );
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async createEquipmentsFromOrder(order: any, userId?: string) {
    try {
      for (const item of order.cart) {
        for (let i = 0; i < item.quantity; i++) {
          await this.equipmentsService.create(
            {
              lab: order.lab?._id
                ? order.lab._id.toString()
                : order.lab
                ? order.lab.toString()
                : null,
              equipmentType: item.equipmentType._id
                ? item.equipmentType._id.toString()
                : item.equipmentType.toString(),
              serialNumber: `SN-${generateBatchNumber(8)}`,
              brand: item.brand,
              modelName: item.modelName,
              purchaseDate: order.purchaseDate,
              inventoryStatus: InventoryStatus.IN_STOCK,
              notes: `Créé automatiquement depuis la commande ${order._id}`,
            },
            userId,
          );
        }
      }
    } catch (error) {
      logger.error(
        `---EQUIPMENT_ORDERS.SERVICE.CREATE_EQUIPMENTS_FROM_ORDER ERROR ${error}---`,
      );
    }
  }
}
