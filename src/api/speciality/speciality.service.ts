import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateSpecialityDto } from './dto/create-speciality.dto';
import { UpdateSpecialityDto } from './dto/update-speciality.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Speciality } from './interfaces/speciality.interface';
import logger from 'src/utils/logger';

@Injectable()
export class SpecialityService {
  constructor(
    @InjectModel('Speciality') private specialityModel: Model<Speciality>,
  ) {}

  async create(createSpecialityDto: CreateSpecialityDto) {
    try {
      logger.info(`---SPECIALITY.SERVICE.CREATE INIT---`);
      const speciality = await this.specialityModel.create(createSpecialityDto);
      logger.info(`---SPECIALITY.SERVICE.CREATE SUCCESS---`);
      return speciality;
    } catch (error) {
      logger.error(`---SPECIALITY.SERVICE.CREATE ERROR ${error}---`);
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
    paginate?: boolean;
  }): Promise<any> {
    try {
      logger.info(`---SPECIALITY.SERVICE.FIND_ALL INIT---`);

      const { page = 1, limit = 10, search, paginate = true } = query;
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

      const pipeline: any[] = [
        { $match: filters },
        {
          $addFields: {
            rankValue: {
              $convert: {
                input: '$rank',
                to: 'int',
                onError: null,
                onNull: null,
              },
            },
          },
        },
        {
          $addFields: {
            hasNoRank: {
              $cond: [{ $eq: ['$rankValue', null] }, 1, 0],
            },
            isAutres: {
              $cond: [
                {
                  $eq: [
                    { $toLower: { $ifNull: ['$name', ''] } },
                    'autres',
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
        { $sort: { isAutres: 1, hasNoRank: 1, rankValue: 1, name: 1 } },
        { $project: { hasNoRank: 0, rankValue: 0, isAutres: 0 } },
      ];

      if (paginate) {
        pipeline.push({ $skip: skip }, { $limit: limit });
      }

      const [data, total] = await Promise.all([
        this.specialityModel.aggregate(pipeline).exec(),
        paginate ? this.specialityModel.countDocuments(filters) : Promise.resolve(0),
      ]);

      logger.info(`---SPECIALITY.SERVICE.FIND_ALL SUCCESS---`);
      if (!paginate) {
        return { data };
      }
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error(`---SPECIALITY.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---SPECIALITY.SERVICE.FIND_ONE INIT---`);
      const speciality = await this.specialityModel.findById(id).exec();
      if (!speciality) {
        throw new HttpException('Spécialité non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---SPECIALITY.SERVICE.FIND_ONE SUCCESS---`);
      return speciality;
    } catch (error) {
      logger.error(`---SPECIALITY.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateSpecialityDto: UpdateSpecialityDto) {
    try {
      logger.info(`---SPECIALITY.SERVICE.UPDATE INIT---`);
      const updated = await this.specialityModel
        .findByIdAndUpdate(
          id,
          { ...updateSpecialityDto, updated_at: new Date() },
          { new: true },
        )
        .exec();
      if (!updated) {
        throw new HttpException('Spécialité non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---SPECIALITY.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(`---SPECIALITY.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---SPECIALITY.SERVICE.REMOVE INIT---`);
      const deleted = await this.specialityModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        throw new HttpException('Spécialité non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---SPECIALITY.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(`---SPECIALITY.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
