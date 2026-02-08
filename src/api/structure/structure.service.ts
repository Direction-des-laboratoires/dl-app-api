import { HttpException, Injectable } from '@nestjs/common';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';
import mongoose, { Model } from 'mongoose';
import { Structure } from './interfaces/structure.interface';
import { InjectModel } from '@nestjs/mongoose';
import logger from 'src/utils/logger';

@Injectable()
export class StructureService {
  constructor(
    @InjectModel('Structure') private structureModel: Model<Structure>,
  ) {}
  async create(createStructureDto: CreateStructureDto) {
    try {
      const structure = await this.structureModel.create(createStructureDto);
      return structure;
    } catch (error) {
      logger.info(`---STRUCTURE.SERVICE.CREATE ERROR--- ${error}`);
      throw new HttpException(error.message, error.status);
    }
  }

  async createMultiple(structuresDto: CreateStructureDto[]) {
    try {
      logger.info(`---STRUCTURE.SERVICE.CREATE_MULTIPLE INIT--- count=${structuresDto.length}`);
      const results = [];
      const errors = [];

      for (const structureDto of structuresDto) {
        try {
          const result = await this.create(structureDto);
          results.push(result);
        } catch (error) {
          errors.push({
            name: structureDto.name,
            error: error.message,
          });
        }
      }

      logger.info(`---STRUCTURE.SERVICE.CREATE_MULTIPLE SUCCESS--- created=${results.length}, failed=${errors.length}`);
      return {
        message: `${results.length} structures créées avec succès`,
        data: results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error(`---STRUCTURE.SERVICE.CREATE_MULTIPLE ERROR--- ${error}`);
      throw new HttpException(
        error.message || 'Erreur lors de la création multiple des structures',
        error.status || 500,
      );
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    region?: string;
    department?: string;
    district?: string;
    level?: string;
    name?: string;
    type?: string;
  }) {
    try {
      const {
        page = 1,
        limit = 10,
        region,
        department,
        district,
        level,
        name,
        type,
      } = query;

      // Construction dynamique des filtres
      const filters: any = {};
      if (region) filters.region = region;
      if (department)
        filters.department = new mongoose.Types.ObjectId(department) || null;
      if (district)
        filters.district = new mongoose.Types.ObjectId(district) || null;
      if (level) filters.level = new mongoose.Types.ObjectId(level) || null;
      if (name) filters.name = { $regex: name, $options: 'i' }; // recherche insensible à la casse
      if (type) filters.type = type;
      // Pagination
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.structureModel
          .find(filters)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 })
          .populate('region', 'name code')
          .populate('department', 'name')
          .populate('district', 'name')
          .populate('level', 'name'),
        this.structureModel.countDocuments(filters),
      ]);

      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new HttpException(error.message || 'Erreur serveur', error.status);
    }
  }

  async findOne(id: string) {
    try {
      const structure = await this.structureModel
        .findById(id)
        .populate('region', 'name code')
        .populate('department', 'name')
        .populate('district', 'name')
        .populate('level', 'name');
      return structure;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async update(id: string, updateStructureDto: UpdateStructureDto) {
    try {
      const updated = await this.structureModel.findByIdAndUpdate(
        id,
        updateStructureDto,
        { new: true },
      );
      return updated;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async remove(id: string) {
    try {
      const deleted = await this.structureModel.findByIdAndUpdate(
        id,
        { active: false },
        { new: true },
      );
      return deleted;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
