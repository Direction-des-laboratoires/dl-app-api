import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Position } from './interfaces/position.interface';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { FindPositionDto } from './dto/find-position.dto';
import logger from 'src/utils/logger';

@Injectable()
export class PositionService {
  constructor(
    @InjectModel('Position') private positionModel: Model<Position>,
  ) {}

  async create(createPositionDto: CreatePositionDto): Promise<any> {
    try {
      logger.info(`---POSITION.SERVICE.CREATE INIT---`);
      const existing = await this.positionModel.findOne({ title: createPositionDto.title });
      if (existing) {
        throw new HttpException('Une position avec ce titre existe déjà', HttpStatus.CONFLICT);
      }
      const created = await this.positionModel.create(createPositionDto);
      logger.info(`---POSITION.SERVICE.CREATE SUCCESS---`);
      return {
        message: 'Position créée avec succès',
        data: created,
      };
    } catch (error) {
      logger.error(`---POSITION.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la création de la position',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createMultiple(positionsDto: CreatePositionDto[]): Promise<any> {
    try {
      logger.info(`---POSITION.SERVICE.CREATE_MULTIPLE INIT--- count=${positionsDto.length}`);
      const results = [];
      const errors = [];

      for (const positionDto of positionsDto) {
        try {
          const result = await this.create(positionDto);
          results.push(result.data);
        } catch (error) {
          errors.push({
            title: positionDto.title,
            error: error.message,
          });
        }
      }

      logger.info(`---POSITION.SERVICE.CREATE_MULTIPLE SUCCESS--- created=${results.length}, failed=${errors.length}`);
      return {
        message: `${results.length} positions créées avec succès`,
        data: results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error(`---POSITION.SERVICE.CREATE_MULTIPLE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la création multiple des positions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindPositionDto): Promise<any> {
    try {
      logger.info(`---POSITION.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, search, active } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (search) {
        filters.title = { $regex: search, $options: 'i' };
      }
      if (active !== undefined) {
        filters.active = active;
      }

      const [data, total] = await Promise.all([
        this.positionModel
          .find(filters)
          .sort({ title: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.positionModel.countDocuments(filters).exec(),
      ]);

      logger.info(`---POSITION.SERVICE.FIND_ALL SUCCESS---`);
      return {
        message: 'Positions récupérées avec succès',
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`---POSITION.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException('Erreur lors de la récupération des positions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: string): Promise<any> {
    const position = await this.positionModel.findById(id).exec();
    if (!position) {
      throw new HttpException('Position non trouvée', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'Position récupérée avec succès',
      data: position,
    };
  }

  async update(id: string, updatePositionDto: UpdatePositionDto): Promise<any> {
    const updated = await this.positionModel.findByIdAndUpdate(
      id,
      { ...updatePositionDto, updated_at: new Date() },
      { new: true },
    ).exec();
    if (!updated) {
      throw new HttpException('Position non trouvée', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'Position mise à jour avec succès',
      data: updated,
    };
  }

  async remove(id: string): Promise<any> {
    const deleted = await this.positionModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new HttpException('Position non trouvée', HttpStatus.NOT_FOUND);
    }
    return { message: 'Position supprimée avec succès' };
  }
}
