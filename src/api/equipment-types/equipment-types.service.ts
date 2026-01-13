import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateEquipmentTypeDto } from './dto/create-equipment-type.dto';
import { UpdateEquipmentTypeDto } from './dto/update-equipment-type.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EquipmentType } from './interfaces/equipment-type.interface';
import logger from 'src/utils/logger';

@Injectable()
export class EquipmentTypesService {
  constructor(
    @InjectModel('EquipmentType')
    private equipmentTypeModel: Model<EquipmentType>,
  ) {}

  async create(createEquipmentTypeDto: CreateEquipmentTypeDto) {
    try {
      logger.info(`---EQUIPMENT_TYPES.SERVICE.CREATE INIT---`);

      const equipmentType = await this.equipmentTypeModel.create(
        createEquipmentTypeDto,
      );

      logger.info(`---EQUIPMENT_TYPES.SERVICE.CREATE SUCCESS---`);
      return equipmentType;
    } catch (error) {
      logger.error(`---EQUIPMENT_TYPES.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message || "Erreur lors de la création du type d'équipement",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    equipmentCategory?: string;
    search?: string;
  }): Promise<any> {
    try {
      logger.info(`---EQUIPMENT_TYPES.SERVICE.FIND_ALL INIT---`);

      const { page = 1, limit = 10, equipmentCategory, search } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (equipmentCategory) filters.equipmentCategory = equipmentCategory;

      // Recherche globale
      if (search && search.trim() !== '') {
        const searchRegex = new RegExp(search.trim(), 'i');
        filters.$or = [
          { name: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { notes: { $regex: searchRegex } },
        ];
      }

      const [data, total] = await Promise.all([
        this.equipmentTypeModel
          .find(filters)
          .populate('equipmentCategory', 'name')
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.equipmentTypeModel.countDocuments(filters),
      ]);

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
      logger.error(`---EQUIPMENT_TYPES.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      logger.info(`---EQUIPMENT_TYPES.SERVICE.FIND_ONE INIT--- id=${id}`);
      const equipmentType = await this.equipmentTypeModel
        .findById(id)
        .populate('equipmentCategory', 'name')
        .lean();

      if (!equipmentType) {
        throw new HttpException(
          "Type d'équipement non trouvé",
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---EQUIPMENT_TYPES.SERVICE.FIND_ONE SUCCESS--- id=${id}`);
      return equipmentType;
    } catch (error) {
      logger.error(`---EQUIPMENT_TYPES.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateEquipmentTypeDto: UpdateEquipmentTypeDto,
  ): Promise<any> {
    try {
      logger.info(`---EQUIPMENT_TYPES.SERVICE.UPDATE INIT--- id=${id}`);

      const updateData: any = {
        ...updateEquipmentTypeDto,
        updated_at: new Date(),
      };

      const updated = await this.equipmentTypeModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('equipmentCategory', 'name')
        .lean();

      if (!updated) {
        throw new HttpException(
          "Type d'équipement non trouvé",
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---EQUIPMENT_TYPES.SERVICE.UPDATE SUCCESS--- id=${id}`);
      return updated;
    } catch (error) {
      logger.error(`---EQUIPMENT_TYPES.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---EQUIPMENT_TYPES.SERVICE.REMOVE INIT--- id=${id}`);
      const deleted = await this.equipmentTypeModel
        .findByIdAndDelete(id)
        .exec();
      if (!deleted) {
        throw new HttpException(
          "Type d'équipement non trouvé",
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---EQUIPMENT_TYPES.SERVICE.REMOVE SUCCESS--- id=${id}`);
      return deleted;
    } catch (error) {
      logger.error(`---EQUIPMENT_TYPES.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
