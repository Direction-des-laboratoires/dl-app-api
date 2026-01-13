import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EquipmentStock } from './interfaces/equipment-stock.interface';
import { CreateEquipmentStockDto } from './dto/create-equipment-stock.dto';
import { UpdateEquipmentStockDto } from './dto/update-equipment-stock.dto';
import { FindEquipmentStockDto } from './dto/find-equipment-stock.dto';
import logger from 'src/utils/logger';
import { User } from '../user/interfaces/user.interface';
import { Role } from 'src/utils/enums/roles.enum';

@Injectable()
export class EquipmentStocksService {
  constructor(
    @InjectModel('EquipmentStock')
    private equipmentStockModel: Model<EquipmentStock>,
    @InjectModel('EquipmentType') private equipmentTypeModel: Model<any>,
  ) {}

  async create(
    createEquipmentStockDto: CreateEquipmentStockDto,
    user?: User,
  ): Promise<EquipmentStock> {
    try {
      logger.info(`---EQUIPMENT_STOCKS.SERVICE.CREATE INIT---`);

      // Logique de labo
      if (user && user.role !== Role.SuperAdmin) {
        createEquipmentStockDto.lab = user.lab.toString();
      }

      const { lab, equipmentType } = createEquipmentStockDto;

      // Vérifier si un stock existe déjà pour cet équipement dans ce labo
      const existing = await this.equipmentStockModel.findOne({
        lab,
        equipmentType,
      });
      if (existing) {
        throw new HttpException(
          'Un stock pour cet équipement existe déjà dans ce laboratoire',
          HttpStatus.CONFLICT,
        );
      }

      const stock = await this.equipmentStockModel.create(createEquipmentStockDto);
      logger.info(`---EQUIPMENT_STOCKS.SERVICE.CREATE SUCCESS---`);
      return stock;
    } catch (error) {
      logger.error(`---EQUIPMENT_STOCKS.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la création du stock',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindEquipmentStockDto, user?: User): Promise<any> {
    try {
      logger.info(`---EQUIPMENT_STOCKS.SERVICE.FIND_ALL INIT---`);
      const {
        lab,
        equipmentType,
        equipmentCategory,
        page = 1,
        limit = 10,
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
        // La recherche peut être plus complexe si on veut chercher dans les noms peuplés
        // Pour l'instant, on reste simple ou on ne met rien si pas de champ texte direct
        // filters.$or = [...];
      }

      const [data, total] = await Promise.all([
        this.equipmentStockModel
          .find(filters)
          .populate('lab', 'name')
          .populate({
            path: 'equipmentType',
            select: 'name equipmentCategory',
            populate: {
              path: 'equipmentCategory',
              select: 'name',
            },
          })
          .sort({ updated_at: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.equipmentStockModel.countDocuments(filters).exec(),
      ]);

      logger.info(`---EQUIPMENT_STOCKS.SERVICE.FIND_ALL SUCCESS---`);
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
      logger.error(`---EQUIPMENT_STOCKS.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<EquipmentStock> {
    try {
      logger.info(`---EQUIPMENT_STOCKS.SERVICE.FIND_ONE INIT--- id=${id}`);
      const stock = await this.equipmentStockModel
        .findById(id)
        .populate('lab', 'name')
        .populate({
          path: 'equipmentType',
          select: 'name equipmentCategory',
          populate: {
            path: 'equipmentCategory',
            select: 'name',
          },
        })
        .exec();

      if (!stock) {
        throw new HttpException('Stock non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---EQUIPMENT_STOCKS.SERVICE.FIND_ONE SUCCESS--- id=${id}`);
      return stock;
    } catch (error) {
      logger.error(`---EQUIPMENT_STOCKS.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateEquipmentStockDto: UpdateEquipmentStockDto,
    user?: User,
  ): Promise<EquipmentStock> {
    try {
      logger.info(`---EQUIPMENT_STOCKS.SERVICE.UPDATE INIT--- id=${id}`);
      const updated = await this.equipmentStockModel
        .findByIdAndUpdate(
          id,
          { ...updateEquipmentStockDto, updated_at: new Date() },
          { new: true },
        )
        .populate('lab', 'name')
        .populate({
          path: 'equipmentType',
          select: 'name equipmentCategory',
          populate: {
            path: 'equipmentCategory',
            select: 'name',
          },
        })
        .exec();

      if (!updated) {
        throw new HttpException('Stock non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---EQUIPMENT_STOCKS.SERVICE.UPDATE SUCCESS--- id=${id}`);
      return updated;
    } catch (error) {
      logger.error(`---EQUIPMENT_STOCKS.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<EquipmentStock> {
    try {
      logger.info(`---EQUIPMENT_STOCKS.SERVICE.REMOVE INIT--- id=${id}`);
      const deleted = await this.equipmentStockModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        throw new HttpException('Stock non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---EQUIPMENT_STOCKS.SERVICE.REMOVE SUCCESS--- id=${id}`);
      return deleted;
    } catch (error) {
      logger.error(`---EQUIPMENT_STOCKS.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateQuantity(
    lab: string,
    equipmentType: string,
    quantity: number,
    unit: string,
    orderId?: string,
  ): Promise<void> {
    try {
      logger.info(`---EQUIPMENT_STOCKS.SERVICE.UPDATE_QUANTITY INIT---`);
      const stock = await this.equipmentStockModel.findOne({ lab, equipmentType });

      if (stock) {
        stock.initialQuantity += quantity;
        await stock.save();
      } else {
        await this.equipmentStockModel.create({
          lab,
          equipmentType,
          initialQuantity: quantity,
          unit,
          minThreshold: 1, // Default threshold
          order: orderId,
        });
      }
      logger.info(`---EQUIPMENT_STOCKS.SERVICE.UPDATE_QUANTITY SUCCESS---`);
    } catch (error) {
      logger.error(`---EQUIPMENT_STOCKS.SERVICE.UPDATE_QUANTITY ERROR ${error}---`);
    }
  }
}
