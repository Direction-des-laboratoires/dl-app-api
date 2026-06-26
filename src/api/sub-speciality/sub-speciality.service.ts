import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateSubSpecialityDto } from './dto/create-sub-speciality.dto';
import { UpdateSubSpecialityDto } from './dto/update-sub-speciality.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubSpeciality } from './interfaces/sub-speciality.interface';
import logger from 'src/utils/logger';

@Injectable()
export class SubSpecialityService {
  constructor(
    @InjectModel('SubSpeciality') private subSpecialityModel: Model<SubSpeciality>,
  ) {}

  async create(createSubSpecialityDto: CreateSubSpecialityDto) {
    try {
      logger.info(`---SUB_SPECIALITY.SERVICE.CREATE INIT---`);
      const subSpeciality = await this.subSpecialityModel.create(createSubSpecialityDto);
      logger.info(`---SUB_SPECIALITY.SERVICE.CREATE SUCCESS---`);
      return subSpeciality;
    } catch (error) {
      logger.error(`---SUB_SPECIALITY.SERVICE.CREATE ERROR ${error}---`);
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
      logger.info(`---SUB_SPECIALITY.SERVICE.FIND_ALL INIT---`);

      const { page = 1, limit = 10, search, paginate = true } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};

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
        this.subSpecialityModel.aggregate(pipeline).exec(),
        paginate ? this.subSpecialityModel.countDocuments(filters) : Promise.resolve(0),
      ]);

      logger.info(`---SUB_SPECIALITY.SERVICE.FIND_ALL SUCCESS---`);
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
      logger.error(`---SUB_SPECIALITY.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---SUB_SPECIALITY.SERVICE.FIND_ONE INIT---`);
      const subSpeciality = await this.subSpecialityModel.findById(id).exec();
      if (!subSpeciality) {
        throw new HttpException('Sous-spécialité non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---SUB_SPECIALITY.SERVICE.FIND_ONE SUCCESS---`);
      return subSpeciality;
    } catch (error) {
      logger.error(`---SUB_SPECIALITY.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateSubSpecialityDto: UpdateSubSpecialityDto) {
    try {
      logger.info(`---SUB_SPECIALITY.SERVICE.UPDATE INIT---`);
      const updated = await this.subSpecialityModel
        .findByIdAndUpdate(
          id,
          { ...updateSubSpecialityDto, updated_at: new Date() },
          { new: true },
        )
        .exec();
      if (!updated) {
        throw new HttpException('Sous-spécialité non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---SUB_SPECIALITY.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(`---SUB_SPECIALITY.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---SUB_SPECIALITY.SERVICE.REMOVE INIT---`);
      const deleted = await this.subSpecialityModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        throw new HttpException('Sous-spécialité non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---SUB_SPECIALITY.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(`---SUB_SPECIALITY.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
