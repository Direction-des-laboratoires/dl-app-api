import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateStaffLevelDto } from './dto/create-staff-level.dto';
import { UpdateStaffLevelDto } from './dto/update-staff-level.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StaffLevel } from './interfaces/staff-level.interface';
import logger from 'src/utils/logger';

@Injectable()
export class StaffLevelService {
  constructor(
    @InjectModel('StaffLevel')
    private staffLevelModel: Model<StaffLevel>,
  ) {}

  async create(createStaffLevelDto: CreateStaffLevelDto) {
    try {
      logger.info(`---STAFF_LEVEL.SERVICE.CREATE INIT---`);
      const staffLevel = await this.staffLevelModel.create(createStaffLevelDto);
      logger.info(`---STAFF_LEVEL.SERVICE.CREATE SUCCESS---`);
      return staffLevel;
    } catch (error) {
      logger.error(`---STAFF_LEVEL.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<any> {
    try {
      logger.info(`---STAFF_LEVEL.SERVICE.FIND_ALL INIT---`);

      const { page = 1, limit = 10, search } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};

      // Recherche globale
      if (search && search.trim() !== '') {
        const searchRegex = new RegExp(search.trim(), 'i');
        filters.$or = [
          { name: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
        ];
      }

      const [data, total] = await Promise.all([
        this.staffLevelModel
          .find(filters)
          .sort({ rank: 1})
          .skip(skip)
          .limit(limit)
          .lean(),
        this.staffLevelModel.countDocuments(filters),
      ]);

      logger.info(`---STAFF_LEVEL.SERVICE.FIND_ALL SUCCESS---`);
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error(`---STAFF_LEVEL.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---STAFF_LEVEL.SERVICE.FIND_ONE INIT---`);
      const staffLevel = await this.staffLevelModel.findById(id).exec();
      if (!staffLevel) {
        throw new HttpException(
          'Niveau de personnel non trouvé',
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---STAFF_LEVEL.SERVICE.FIND_ONE SUCCESS---`);
      return staffLevel;
    } catch (error) {
      logger.error(`---STAFF_LEVEL.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateStaffLevelDto: UpdateStaffLevelDto) {
    try {
      logger.info(`---STAFF_LEVEL.SERVICE.UPDATE INIT---`);
      const updated = await this.staffLevelModel
        .findByIdAndUpdate(
          id,
          { ...updateStaffLevelDto, updated_at: new Date() },
          { new: true },
        )
        .exec();
      if (!updated) {
        throw new HttpException(
          'Niveau de personnel non trouvé',
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---STAFF_LEVEL.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(`---STAFF_LEVEL.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---STAFF_LEVEL.SERVICE.REMOVE INIT---`);
      const deleted = await this.staffLevelModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        throw new HttpException(
          'Niveau de personnel non trouvé',
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---STAFF_LEVEL.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(`---STAFF_LEVEL.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
