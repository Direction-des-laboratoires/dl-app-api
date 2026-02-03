import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Environment } from './interfaces/environment.interface';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
import { FindEnvironmentDto } from './dto/find-environment.dto';
import logger from 'src/utils/logger';

@Injectable()
export class EnvironmentService {
  constructor(
    @InjectModel('Environment') private environmentModel: Model<Environment>,
  ) {}

  async create(createEnvironmentDto: CreateEnvironmentDto): Promise<any> {
    try {
      logger.info(`---ENVIRONMENT.SERVICE.CREATE INIT---`);
      const existing = await this.environmentModel.findOne({ code: createEnvironmentDto.code });
      if (existing) {
        throw new HttpException('Un environnement avec ce code existe déjà', HttpStatus.CONFLICT);
      }
      const created = await this.environmentModel.create(createEnvironmentDto);
      logger.info(`---ENVIRONMENT.SERVICE.CREATE SUCCESS---`);
      return {
        message: 'Environnement créé avec succès',
        data: created,
      };
    } catch (error) {
      logger.error(`---ENVIRONMENT.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la création de l\'environnement',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindEnvironmentDto): Promise<any> {
    try {
      logger.info(`---ENVIRONMENT.SERVICE.FIND_ALL INIT---`);
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
        this.environmentModel
          .find(filters)
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.environmentModel.countDocuments(filters).exec(),
      ]);

      logger.info(`---ENVIRONMENT.SERVICE.FIND_ALL SUCCESS---`);
      return {
        message: 'Environnements récupérés avec succès',
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`---ENVIRONMENT.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        'Erreur lors de la récupération des environnements',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<any> {
    const environment = await this.environmentModel.findById(id).exec();
    if (!environment) {
      throw new HttpException('Environnement non trouvé', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'Environnement récupéré avec succès',
      data: environment,
    };
  }

  async update(id: string, updateEnvironmentDto: UpdateEnvironmentDto): Promise<any> {
    const updated = await this.environmentModel.findByIdAndUpdate(
      id,
      { ...updateEnvironmentDto, updated_at: new Date() },
      { new: true },
    ).exec();
    if (!updated) {
      throw new HttpException('Environnement non trouvé', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'Environnement mis à jour avec succès',
      data: updated,
    };
  }

  async remove(id: string): Promise<any> {
    const deleted = await this.environmentModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new HttpException('Environnement non trouvé', HttpStatus.NOT_FOUND);
    }
    return { message: 'Environnement supprimé avec succès' };
  }
}
