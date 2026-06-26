import { HttpException, Injectable, HttpStatus } from '@nestjs/common';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { District } from './interfaces/district.interface';
import districts from '../../utils/seeds/district.json';
import logger from 'src/utils/logger';

@Injectable()
export class DistrictService {
  constructor(
    @InjectModel('District') private districtModel: Model<District>,
  ) {}

  async create(createDistrictDto: CreateDistrictDto) {
    try {
      logger.info(`---DISTRICT.SERVICE.CREATE INIT---`);
      const district = await this.districtModel.create(createDistrictDto);
      logger.info(`---DISTRICT.SERVICE.CREATE SUCCESS---`);
      return district;
    } catch (error) {
      logger.error(`---DISTRICT.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(error.message, error.status);
    }
  }

  async createBulk(districtsDto: CreateDistrictDto[]) {
    try {
      logger.info(`---DISTRICT.SERVICE.CREATE_BULK INIT--- count=${districtsDto.length}`);
      const results = [];
      const errors = [];

      for (const districtDto of districtsDto) {
        try {
          const result = await this.create(districtDto);
          results.push(result);
        } catch (error) {
          errors.push({
            name: districtDto.name,
            error: error.message,
          });
        }
      }

      logger.info(`---DISTRICT.SERVICE.CREATE_BULK SUCCESS--- created=${results.length}, failed=${errors.length}`);
      return {
        message: `${results.length} districts créés avec succès`,
        data: results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error(`---DISTRICT.SERVICE.CREATE_BULK ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la création multiple des districts',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createMany() {
    try {
      logger.info(`---DISTRICT.SERVICE.CREATE_MANY INIT---`);
      const districtSeeds = await this.districtModel.insertMany(districts);
      logger.info(`---DISTRICT.SERVICE.CREATE_MANY SUCCESS---`);
      return districtSeeds;
    } catch (error) {
      logger.error(`---DISTRICT.SERVICE.CREATE_MANY ERROR ${error}---`);
      throw new HttpException(error.message, error.status);
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    name?: string;
    region?: string;
    search?: string;
  }): Promise<any> {
    try {
      logger.info(`---DISTRICT.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, name, region, search } = query;

      const filters: any = {};

      // Recherche globale
      if (search && search.trim() !== '') {
        const searchRegex = new RegExp(search.trim(), 'i');
        filters.$or = [
          { name: { $regex: searchRegex } },
          { code: { $regex: searchRegex } },
        ];
      } else {
        // Sinon, utiliser les filtres individuels
        if (name) filters.name = { $regex: name, $options: 'i' };
      }
      if (region) filters.region = region;

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.districtModel
          .find(filters)
          .skip(skip)
          .limit(limit)
          .sort({ name: 1 })
          .populate('region', 'name code')
          .lean(),
        this.districtModel.countDocuments(filters),
      ]);

      logger.info(`---DISTRICT.SERVICE.FIND_ALL SUCCESS--- total=${total}`);
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error(`---DISTRICT.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---DISTRICT.SERVICE.FIND_ONE INIT---`);
      const district = await this.districtModel
        .findById(id)
        .populate('region', 'name code')
        .exec();
      if (!district) {
        throw new HttpException('District non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---DISTRICT.SERVICE.FIND_ONE SUCCESS---`);
      return district;
    } catch (error) {
      logger.error(`---DISTRICT.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateDistrictDto: UpdateDistrictDto) {
    try {
      logger.info(`---DISTRICT.SERVICE.UPDATE INIT---`);
      const updated = await this.districtModel
        .findByIdAndUpdate(
          id,
          { ...updateDistrictDto, updated_at: new Date() },
          { new: true },
        )
        .populate('region', 'name code')
        .exec();
      if (!updated) {
        throw new HttpException('District non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---DISTRICT.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(`---DISTRICT.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---DISTRICT.SERVICE.REMOVE INIT---`);
      const deleted = await this.districtModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        throw new HttpException('District non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---DISTRICT.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(`---DISTRICT.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
