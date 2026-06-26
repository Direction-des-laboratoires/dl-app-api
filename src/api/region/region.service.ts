import { HttpException, Injectable, HttpStatus } from '@nestjs/common';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { Region } from './interfaces/region.interface';
import { RegionPole } from '../region-pole/interfaces/region-pole.interface';
import regions from '../../utils/seeds/regions.json';
import logger from 'src/utils/logger';

@Injectable()
export class RegionService {
  constructor(
    @InjectModel('Region') private regionModel: Model<Region>,
    @InjectModel('RegionPole') private regionPoleModel: Model<RegionPole>,
  ) {}
  async create(createRegionDto: CreateRegionDto) {
    try {
      logger.info(`---REGION.SERVICE.CREATE INIT---`);
      const region = await this.regionModel.create(createRegionDto);
      logger.info(`---REGION.SERVICE.CREATE SUCCESS---`);
      return region;
    } catch (error) {
      logger.error(`---REGION.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(error.message, error.status);
    }
  }

  async createMany() {
    try {
      logger.info(`---REGION.SERVICE.CREATE_MANY INIT---`);
      let defaultPole = await this.regionPoleModel.findOne({ code: 'DEFAULT_POLE' });
      if (!defaultPole) {
        defaultPole = await this.regionPoleModel.create({
          name: 'Pôle non assigné',
          code: 'DEFAULT_POLE',
          description: "Pôle généré automatiquement pour l'import des régions",
          active: true,
        });
      }
      const seededRegions = regions.map((region: any) => ({
        ...region,
        pole: defaultPole._id,
      }));
      const regionSeeds = await this.regionModel.insertMany(seededRegions);
      logger.info(`---REGION.SERVICE.CREATE_MANY SUCCESS---`);
      return regionSeeds;
    } catch (error) {
      logger.error(`---REGION.SERVICE.CREATE_MANY ERROR ${error}---`);
      throw new HttpException(error.message, error.status);
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    name?: string;
    code?: string;
    search?: string;
    pole?: string;
    poleId?: string;
  }): Promise<any> {
    try {
      logger.info(`---REGION.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, name, code, search, pole, poleId } = query;

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
        if (code) filters.code = { $regex: code, $options: 'i' };
      }
      const requestedPoleId = poleId || pole;
      if (requestedPoleId) {
        const normalizedPoleId = String(requestedPoleId).trim();
        if (!mongoose.Types.ObjectId.isValid(normalizedPoleId)) {
          throw new HttpException('Identifiant de pôle invalide', HttpStatus.BAD_REQUEST);
        }
        filters.pole = new mongoose.Types.ObjectId(normalizedPoleId);
      }

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.regionModel
          .find(filters)
          .skip(skip)
          .limit(limit)
          .sort({ name: 1 })
          .lean(),
        this.regionModel.countDocuments(filters),
      ]);

      logger.info(`---REGION.SERVICE.FIND_ALL SUCCESS--- total=${total}`);
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error(`---REGION.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---REGION.SERVICE.FIND_ONE INIT---`);
      const region = await this.regionModel
        .findById(id)
        .populate('pole', 'name code')
        .exec();
      if (!region) {
        throw new HttpException('Région non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---REGION.SERVICE.FIND_ONE SUCCESS---`);
      return region;
    } catch (error) {
      logger.error(`---REGION.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateRegionDto: UpdateRegionDto) {
    try {
      logger.info(`---REGION.SERVICE.UPDATE INIT---`);
      const updated = await this.regionModel
        .findByIdAndUpdate(
          id,
          { ...updateRegionDto, updated_at: new Date() },
          { new: true },
        )
        .populate('pole', 'name code')
        .exec();
      if (!updated) {
        throw new HttpException('Région non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---REGION.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(`---REGION.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---REGION.SERVICE.REMOVE INIT---`);
      const deleted = await this.regionModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        throw new HttpException('Région non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---REGION.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(`---REGION.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
