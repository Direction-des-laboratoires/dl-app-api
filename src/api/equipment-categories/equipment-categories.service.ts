import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateEquipmentCategoryDto } from './dto/create-equipment-category.dto';
import { UpdateEquipmentCategoryDto } from './dto/update-equipment-category.dto';
import { FindEquipmentCategoryDto } from './dto/find-equipment-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import logger from 'src/utils/logger';

@Injectable()
export class EquipmentCategoriesService {
  constructor(
    @InjectModel('EquipmentCategory') private equipmentCategoryModel: Model<any>,
  ) {}

  async create(createEquipmentCategoryDto: CreateEquipmentCategoryDto) {
    try {
      logger.info(`---EQUIPMENT_CATEGORIES.SERVICE.CREATE INIT---`);
      const equipmentCategory = await this.equipmentCategoryModel.create(
        createEquipmentCategoryDto,
      );
      logger.info(`---EQUIPMENT_CATEGORIES.SERVICE.CREATE SUCCESS---`);
      return equipmentCategory;
    } catch (error) {
      logger.error(`---EQUIPMENT_CATEGORIES.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindEquipmentCategoryDto) {
    try {
      logger.info(`---EQUIPMENT_CATEGORIES.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, search } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.equipmentCategoryModel
          .find(filters)
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.equipmentCategoryModel.countDocuments(filters).exec(),
      ]);

      logger.info(`---EQUIPMENT_CATEGORIES.SERVICE.FIND_ALL SUCCESS---`);
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
      logger.error(`---EQUIPMENT_CATEGORIES.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---EQUIPMENT_CATEGORIES.SERVICE.FIND_ONE INIT---`);
      const equipmentCategory = await this.equipmentCategoryModel.findById(id).exec();
      if (!equipmentCategory) {
        throw new HttpException(
          "Catégorie d'équipement non trouvé",
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---EQUIPMENT_CATEGORIES.SERVICE.FIND_ONE SUCCESS---`);
      return equipmentCategory;
    } catch (error) {
      logger.error(`---EQUIPMENT_CATEGORIES.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateEquipmentCategoryDto: UpdateEquipmentCategoryDto) {
    try {
      logger.info(`---EQUIPMENT_CATEGORIES.SERVICE.UPDATE INIT---`);
      const updated = await this.equipmentCategoryModel
        .findByIdAndUpdate(
          id,
          { ...updateEquipmentCategoryDto, updated_at: new Date() },
          { new: true },
        )
        .exec();
      if (!updated) {
        throw new HttpException(
          "Catégorie d'équipement non trouvé",
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---EQUIPMENT_CATEGORIES.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(`---EQUIPMENT_CATEGORIES.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---EQUIPMENT_CATEGORIES.SERVICE.REMOVE INIT---`);
      const deleted = await this.equipmentCategoryModel
        .findByIdAndDelete(id)
        .exec();
      if (!deleted) {
        throw new HttpException(
          "Catégorie d'équipement non trouvé",
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---EQUIPMENT_CATEGORIES.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(`---EQUIPMENT_CATEGORIES.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
