import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegionPole } from './interfaces/region-pole.interface';
import { CreateRegionPoleDto } from './dto/create-region-pole.dto';
import { UpdateRegionPoleDto } from './dto/update-region-pole.dto';
import { FindRegionPoleDto } from './dto/find-region-pole.dto';
import logger from 'src/utils/logger';

@Injectable()
export class RegionPoleService {
  constructor(
    @InjectModel('RegionPole') private regionPoleModel: Model<RegionPole>,
  ) {}

  async create(createRegionPoleDto: CreateRegionPoleDto): Promise<any> {
    try {
      logger.info(`---REGION_POLE.SERVICE.CREATE INIT---`);
      const existing = await this.regionPoleModel.findOne({
        $or: [{ code: createRegionPoleDto.code }, { name: createRegionPoleDto.name }],
      });
      if (existing) {
        throw new HttpException(
          'Un pôle avec ce nom ou ce code existe déjà',
          HttpStatus.CONFLICT,
        );
      }
      const created = await this.regionPoleModel.create(createRegionPoleDto);
      logger.info(`---REGION_POLE.SERVICE.CREATE SUCCESS---`);
      return {
        message: 'Pôle de région créé avec succès',
        data: created,
      };
    } catch (error) {
      logger.error(`---REGION_POLE.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la création du pôle de région',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindRegionPoleDto): Promise<any> {
    try {
      logger.info(`---REGION_POLE.SERVICE.FIND_ALL INIT---`);
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
        this.regionPoleModel.find(filters).sort({ name: 1 }).skip(skip).limit(limit),
        this.regionPoleModel.countDocuments(filters),
      ]);

      logger.info(`---REGION_POLE.SERVICE.FIND_ALL SUCCESS---`);
      return {
        message: 'Pôles de région récupérés avec succès',
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`---REGION_POLE.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la récupération des pôles de région',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<any> {
    const pole = await this.regionPoleModel.findById(id).exec();
    if (!pole) {
      throw new HttpException('Pôle de région non trouvé', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'Pôle de région récupéré avec succès',
      data: pole,
    };
  }

  async update(id: string, updateRegionPoleDto: UpdateRegionPoleDto): Promise<any> {
    const updated = await this.regionPoleModel
      .findByIdAndUpdate(id, { ...updateRegionPoleDto, updated_at: new Date() }, { new: true })
      .exec();
    if (!updated) {
      throw new HttpException('Pôle de région non trouvé', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'Pôle de région mis à jour avec succès',
      data: updated,
    };
  }

  async remove(id: string): Promise<any> {
    const deleted = await this.regionPoleModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new HttpException('Pôle de région non trouvé', HttpStatus.NOT_FOUND);
    }
    return { message: 'Pôle de région supprimé avec succès' };
  }
}
