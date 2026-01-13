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

@Injectable()
export class EquipmentOrdersService {
  constructor(
    @InjectModel('EquipmentOrder')
    private equipmentOrderModel: Model<EquipmentOrder>,
    @InjectModel('EquipmentType') private equipmentTypeModel: Model<any>,
    private equipmentStocksService: EquipmentStocksService,
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

      const order = await this.equipmentOrderModel.create(
        createEquipmentOrderDto,
      );

      // Si le statut est COMPLETED à la création, on met à jour le stock
      if (order.status === OrderStatusEnum.COMPLETED && order.lab) {
        await this.equipmentStocksService.updateQuantity(
          order.lab.toString(),
          order.equipmentType.toString(),
          order.quantity,
          order.unit,
        );
      }

      await order.populate('lab', 'name');
      await order.populate('supplier', 'name');
      await order.populate('equipmentType', 'name');
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
      if (equipmentType) filters.equipmentType = equipmentType;
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
        filters.equipmentType = { $in: equipmentTypeIds };
      }

      if (search) {
        filters.$or = [
          { notes: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.equipmentOrderModel
          .find(filters)
          .populate('lab', 'name')
          .populate('supplier', 'name email phoneNumber')
          .populate('equipmentType', 'name')
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
        .populate('equipmentType', 'name')
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
      const currentOrder = await this.equipmentOrderModel
        .findById(id)
        .populate('equipmentType');
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
        .populate('equipmentType', 'name')
        .populate('validatedBy', 'firstname lastname phoneNumber email')
        .populate('completedBy', 'firstname lastname phoneNumber email')
        .lean();

      // Si le statut passe à COMPLETED, on augmente le stock du labo
      if (newStatus === OrderStatusEnum.COMPLETED) {
        logger.info(
          `---EQUIPMENT_ORDERS.SERVICE.UPDATE STATUS COMPLETED--- updating stock quantity`,
        );

        const equipmentType = currentOrder.equipmentType;
        if (equipmentType && currentOrder.lab) {
          await this.equipmentStocksService.updateQuantity(
            currentOrder.lab.toString(),
            equipmentType._id.toString(),
            currentOrder.quantity,
            currentOrder.unit,
          );
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

      // Si la commande était COMPLETED, on décrémente le stock du labo
      if (order.status === OrderStatusEnum.COMPLETED && order.lab) {
        await this.equipmentStocksService.updateQuantity(
          order.lab.toString(),
          order.equipmentType.toString(),
          -order.quantity,
          order.unit,
        );
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
}
