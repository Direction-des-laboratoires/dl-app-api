import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IntrantCategory } from './interfaces/intrant-category.interface';
import { CreateIntrantCategoryDto } from './dto/create-intrant-category.dto';
import { UpdateIntrantCategoryDto } from './dto/update-intrant-category.dto';
import { FindIntrantCategoryDto } from './dto/find-intrant-category.dto';
import logger from 'src/utils/logger';

@Injectable()
export class IntrantCategoriesService {
  constructor(
    @InjectModel('IntrantCategory')
    private intrantCategoryModel: Model<IntrantCategory>,
  ) {}

  async create(
    createIntrantCategoryDto: CreateIntrantCategoryDto,
  ): Promise<IntrantCategory> {
    try {
      logger.info(`---INTRANT_CATEGORIES.SERVICE.CREATE INIT---`);
      const existing = await this.intrantCategoryModel.findOne({
        name: createIntrantCategoryDto.name,
      });
      if (existing) {
        throw new HttpException(
          'Cette catégorie existe déjà',
          HttpStatus.CONFLICT,
        );
      }
      const category = await this.intrantCategoryModel.create(
        createIntrantCategoryDto,
      );
      logger.info(`---INTRANT_CATEGORIES.SERVICE.CREATE SUCCESS---`);
      return category;
    } catch (error) {
      logger.error(`---INTRANT_CATEGORIES.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindIntrantCategoryDto): Promise<any> {
    try {
      const { page = 1, limit = 10, search } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (search) {
        filters.name = { $regex: search, $options: 'i' };
      }

      const [data, total] = await Promise.all([
        this.intrantCategoryModel
          .find(filters)
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.intrantCategoryModel.countDocuments(filters).exec(),
      ]);

      return {
        data,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: string): Promise<IntrantCategory> {
    try {
      const category = await this.intrantCategoryModel.findById(id).exec();
      if (!category) {
        throw new HttpException('Catégorie non trouvée', HttpStatus.NOT_FOUND);
      }
      return category;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateIntrantCategoryDto: UpdateIntrantCategoryDto,
  ): Promise<IntrantCategory> {
    try {
      const updated = await this.intrantCategoryModel
        .findByIdAndUpdate(
          id,
          { ...updateIntrantCategoryDto, updated_at: new Date() },
          { new: true },
        )
        .exec();
      if (!updated) {
        throw new HttpException('Catégorie non trouvée', HttpStatus.NOT_FOUND);
      }
      return updated;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<IntrantCategory> {
    try {
      const deleted = await this.intrantCategoryModel
        .findByIdAndDelete(id)
        .exec();
      if (!deleted) {
        throw new HttpException('Catégorie non trouvée', HttpStatus.NOT_FOUND);
      }
      return deleted;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
