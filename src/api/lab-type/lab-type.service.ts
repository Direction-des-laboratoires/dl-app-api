import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import logger from 'src/utils/logger';
import { CreateLabTypeDto } from './dto/create-lab-type.dto';
import { FindLabTypeDto } from './dto/find-lab-type.dto';
import { UpdateLabTypeDto } from './dto/update-lab-type.dto';
import { LabType } from './interfaces/lab-type.interface';

@Injectable()
export class LabTypeService {
  constructor(@InjectModel('LabType') private labTypeModel: Model<LabType>) {}

  async create(createLabTypeDto: CreateLabTypeDto): Promise<any> {
    try {
      logger.info(`---LAB_TYPE.SERVICE.CREATE INIT---`);
      const existing = await this.labTypeModel.findOne({
        $or: [{ code: createLabTypeDto.code }, { name: createLabTypeDto.name }],
      });
      if (existing) {
        throw new HttpException(
          'Un type de labo avec ce nom ou ce code existe déjà',
          HttpStatus.CONFLICT,
        );
      }
      const created = await this.labTypeModel.create(createLabTypeDto);
      logger.info(`---LAB_TYPE.SERVICE.CREATE SUCCESS---`);
      return {
        message: 'Type de labo créé avec succès',
        data: created,
      };
    } catch (error) {
      logger.error(`---LAB_TYPE.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la création du type de labo',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createBulk(labTypesDto: CreateLabTypeDto[]): Promise<any> {
    try {
      logger.info(
        `---LAB_TYPE.SERVICE.CREATE_BULK INIT--- count=${labTypesDto.length}`,
      );
      const results = [];
      const errors = [];

      for (const labTypeDto of labTypesDto) {
        try {
          const result = await this.create(labTypeDto);
          results.push(result.data);
        } catch (error) {
          errors.push({
            name: labTypeDto.name,
            code: labTypeDto.code,
            error: error.message,
          });
        }
      }

      logger.info(
        `---LAB_TYPE.SERVICE.CREATE_BULK SUCCESS--- created=${results.length}, failed=${errors.length}`,
      );
      return {
        message: `${results.length} types de labo créés avec succès`,
        data: results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error(`---LAB_TYPE.SERVICE.CREATE_BULK ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la création multiple des types de labo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindLabTypeDto): Promise<any> {
    try {
      logger.info(`---LAB_TYPE.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, search, active } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ];
      }
      if (active !== undefined) {
        filters.active = active;
      }

      const [data, total] = await Promise.all([
        this.labTypeModel.find(filters).sort({ name: 1 }).skip(skip).limit(limit),
        this.labTypeModel.countDocuments(filters),
      ]);

      logger.info(`---LAB_TYPE.SERVICE.FIND_ALL SUCCESS---`);
      return {
        message: 'Types de labo récupérés avec succès',
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`---LAB_TYPE.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la récupération des types de labo',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<any> {
    const labType = await this.labTypeModel.findById(id).exec();
    if (!labType) {
      throw new HttpException('Type de labo non trouvé', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'Type de labo récupéré avec succès',
      data: labType,
    };
  }

  async update(id: string, updateLabTypeDto: UpdateLabTypeDto): Promise<any> {
    const updated = await this.labTypeModel
      .findByIdAndUpdate(id, { ...updateLabTypeDto, updated_at: new Date() }, { new: true })
      .exec();
    if (!updated) {
      throw new HttpException('Type de labo non trouvé', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'Type de labo mis à jour avec succès',
      data: updated,
    };
  }

  async remove(id: string): Promise<any> {
    const deleted = await this.labTypeModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new HttpException('Type de labo non trouvé', HttpStatus.NOT_FOUND);
    }
    return { message: 'Type de labo supprimé avec succès' };
  }
}
