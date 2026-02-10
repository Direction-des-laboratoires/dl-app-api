import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EnvironmentPosition } from './interfaces/environment-position.interface';
import { CreateEnvironmentPositionDto } from './dto/create-environment-position.dto';
import { UpdateEnvironmentPositionDto } from './dto/update-environment-position.dto';
import { FindEnvironmentPositionDto } from './dto/find-environment-position.dto';
import logger from 'src/utils/logger';

@Injectable()
export class EnvironmentPositionService {
  constructor(
    @InjectModel('EnvironmentPosition') private environmentPositionModel: Model<EnvironmentPosition>,
  ) {}

  async create(createEnvironmentPositionDto: CreateEnvironmentPositionDto): Promise<any> {
    try {
      logger.info(`---ENVIRONMENT_POSITION.SERVICE.CREATE INIT---`);
      const created = await this.environmentPositionModel.create(createEnvironmentPositionDto);
      logger.info(`---ENVIRONMENT_POSITION.SERVICE.CREATE SUCCESS---`);
      return {
        message: 'Position d\'environnement créée avec succès',
        data: created,
      };
    } catch (error) {
      logger.error(`---ENVIRONMENT_POSITION.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la création de la position d\'environnement',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createBulk(environmentId: string, positionIds: string[]): Promise<any> {
    try {
      logger.info(`---ENVIRONMENT_POSITION.SERVICE.CREATE_BULK INIT--- environmentId=${environmentId}, count=${positionIds.length}`);
      
      const results = [];
      const errors = [];

      for (const positionId of positionIds) {
        try {
          // Vérifier si cette association existe déjà
          const existing = await this.environmentPositionModel.findOne({
            environment: environmentId,
            position: positionId,
          });

          if (existing) {
            errors.push({
              positionId,
              error: 'Cette position est déjà associée à cet environnement',
            });
            continue;
          }

          const created = await this.environmentPositionModel.create({
            environment: environmentId,
            position: positionId,
          });
          results.push(created);
        } catch (error) {
          errors.push({
            positionId,
            error: error.message,
          });
        }
      }

      logger.info(`---ENVIRONMENT_POSITION.SERVICE.CREATE_BULK SUCCESS--- created=${results.length}, failed=${errors.length}`);
      return {
        message: `${results.length} positions d'environnement créées avec succès`,
        data: results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error(`---ENVIRONMENT_POSITION.SERVICE.CREATE_BULK ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la création multiple des positions d\'environnement',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindEnvironmentPositionDto): Promise<any> {
    try {
      logger.info(`---ENVIRONMENT_POSITION.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, environment, position, active } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (environment) {
        filters.environment = environment;
      }
      if (position) {
        filters.position = position;
      }
      if (active !== undefined) {
        filters.active = active;
      }

      const [data, total] = await Promise.all([
        this.environmentPositionModel
          .find(filters)
          .populate('environment')
          .populate('position')
          .skip(skip)
          .limit(limit)
          .exec(),
        this.environmentPositionModel.countDocuments(filters).exec(),
      ]);

      logger.info(`---ENVIRONMENT_POSITION.SERVICE.FIND_ALL SUCCESS---`);
      return {
        message: 'Positions d\'environnement récupérées avec succès',
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`---ENVIRONMENT_POSITION.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        'Erreur lors de la récupération des positions d\'environnement',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<any> {
    const envPosition = await this.environmentPositionModel
      .findById(id)
      .populate('environment')
      .populate('position')
      .exec();
    if (!envPosition) {
      throw new HttpException('Position d\'environnement non trouvée', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'Position d\'environnement récupérée avec succès',
      data: envPosition,
    };
  }

  async update(id: string, updateEnvironmentPositionDto: UpdateEnvironmentPositionDto): Promise<any> {
    const updated = await this.environmentPositionModel.findByIdAndUpdate(
      id,
      { ...updateEnvironmentPositionDto, updated_at: new Date() },
      { new: true },
    ).populate('environment').populate('position').exec();
    if (!updated) {
      throw new HttpException('Position d\'environnement non trouvée', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'Position d\'environnement mise à jour avec succès',
      data: updated,
    };
  }

  async remove(id: string): Promise<any> {
    const deleted = await this.environmentPositionModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new HttpException('Position d\'environnement non trouvée', HttpStatus.NOT_FOUND);
    }
    return { message: 'Position d\'environnement supprimée avec succès' };
  }
}
