import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import logger from 'src/utils/logger';
import { CreateStructureLevelEquipmentTypeDto } from './dto/create-structure-level-equipment-type.dto';
import { UpdateStructureLevelEquipmentTypeDto } from './dto/update-structure-level-equipment-type.dto';
import { StructureLevelEquipmentType } from './interfaces/structure-level-equipment-type.interface';

@Injectable()
export class StructureLevelEquipmentTypeService {
  constructor(
    @InjectModel('StructureLevelEquipmentType')
    private model: Model<StructureLevelEquipmentType>,
  ) {}

  async create(
    createDto: CreateStructureLevelEquipmentTypeDto,
  ): Promise<StructureLevelEquipmentType> {
    try {
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.CREATE INIT---`);
      const existing = await this.model.findOne({
        structureLevel: createDto.structureLevel,
        equipmentType: createDto.equipmentType,
      });
      if (existing) {
        throw new HttpException(
          'Cette association structureLevel-equipmentType existe déjà',
          HttpStatus.CONFLICT,
        );
      }
      const created = await this.model.create({
        ...createDto,
        quantity: createDto.quantity ?? 1,
        required: createDto.required ?? false,
      });
      await created.populate('structureLevel', 'name code');
      await created.populate('equipmentType', 'name description');
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.CREATE SUCCESS---`);
      return created;
    } catch (error) {
      logger.error(
        `---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.CREATE ERROR ${error}---`,
      );
      throw new HttpException(
        error.message || 'Erreur lors de la création',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query?: {
    structureLevel?: string;
    equipmentType?: string;
    levelCode?: string;
    search?: string;
  }): Promise<StructureLevelEquipmentType[]> {
    try {
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.FIND_ALL INIT---`);
      const andConditions: any[] = [];

      if (query?.equipmentType) {
        andConditions.push({ equipmentType: query.equipmentType });
      }

      if (query?.structureLevel) {
        andConditions.push({ structureLevel: query.structureLevel });
      } else if (query?.levelCode?.trim()) {
        const StructureLevelModel = this.model.db.model('StructureLevel');
        const escaped = query.levelCode.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matchingLevels = await StructureLevelModel.find({
          code: { $regex: new RegExp(`^${escaped}$`, 'i') },
        })
          .select('_id')
          .lean();
        const ids = matchingLevels.map((l: any) => l._id);
        if (ids.length === 0) {
          return [];
        }
        andConditions.push({ structureLevel: { $in: ids } });
      }

      if (query?.search?.trim()) {
        const searchRegex = new RegExp(
          query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'i',
        );
        const StructureLevelModel = this.model.db.model('StructureLevel');
        const EquipmentTypeModel = this.model.db.model('EquipmentType');

        const [matchingLevels, matchingEquipmentTypes] = await Promise.all([
          StructureLevelModel.find({
            $or: [
              { name: searchRegex },
              { code: searchRegex },
              { description: searchRegex },
            ],
          })
            .select('_id')
            .lean(),
          EquipmentTypeModel.find({
            $or: [
              { name: searchRegex },
              { description: searchRegex },
              { notes: searchRegex },
            ],
          })
            .select('_id')
            .lean(),
        ]);

        const slIds = matchingLevels.map((l: any) => l._id);
        const etIds = matchingEquipmentTypes.map((e: any) => e._id);
        if (slIds.length === 0 && etIds.length === 0) {
          return [];
        }
        const searchOr: any[] = [];
        if (slIds.length > 0) {
          searchOr.push({ structureLevel: { $in: slIds } });
        }
        if (etIds.length > 0) {
          searchOr.push({ equipmentType: { $in: etIds } });
        }
        andConditions.push({ $or: searchOr });
      }

      const filters =
        andConditions.length === 0
          ? {}
          : andConditions.length === 1
            ? andConditions[0]
            : { $and: andConditions };

      const result = await this.model
        .find(filters)
        .populate('structureLevel', 'name code')
        .populate('equipmentType', 'name description')
        .sort({ created_at: -1 })
        .exec();
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.FIND_ALL SUCCESS---`);
      return result;
    } catch (error) {
      logger.error(
        `---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.FIND_ALL ERROR ${error}---`,
      );
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<StructureLevelEquipmentType> {
    try {
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.FIND_ONE INIT---`);
      const item = await this.model
        .findById(id)
        .populate('structureLevel', 'name code')
        .populate('equipmentType', 'name description')
        .exec();
      if (!item) {
        throw new HttpException(
          'Association non trouvée',
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.FIND_ONE SUCCESS---`);
      return item;
    } catch (error) {
      logger.error(
        `---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.FIND_ONE ERROR ${error}---`,
      );
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateDto: UpdateStructureLevelEquipmentTypeDto,
  ): Promise<StructureLevelEquipmentType> {
    try {
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.UPDATE INIT---`);
      const updated = await this.model
        .findByIdAndUpdate(
          id,
          { ...updateDto, updated_at: new Date() },
          { new: true },
        )
        .populate('structureLevel', 'name code')
        .populate('equipmentType', 'name description')
        .exec();
      if (!updated) {
        throw new HttpException(
          'Association non trouvée',
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(
        `---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.UPDATE ERROR ${error}---`,
      );
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.REMOVE INIT---`);
      const deleted = await this.model.findByIdAndDelete(id).exec();
      if (!deleted) {
        throw new HttpException(
          'Association non trouvée',
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.REMOVE SUCCESS---`);
    } catch (error) {
      logger.error(
        `---STRUCTURE_LEVEL_EQUIPMENT_TYPE.SERVICE.REMOVE ERROR ${error}---`,
      );
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
