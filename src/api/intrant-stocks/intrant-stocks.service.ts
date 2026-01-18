import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IntrantStock } from './interfaces/intrant-stock.interface';
import { CreateIntrantStockDto } from './dto/create-intrant-stock.dto';
import { UpdateIntrantStockDto } from './dto/update-intrant-stock.dto';
import { FindIntrantStockDto } from './dto/find-intrant-stock.dto';
import logger from 'src/utils/logger';
import { User } from '../user/interfaces/user.interface';
import { Role } from 'src/utils/enums/roles.enum';
import { generateBatchNumber } from 'src/utils/functions/code_generation';
import { IntrantOrderStatusEnum } from '../intrant-orders/schemas/intrant-order.schema';
import { buildStatisticsFilters } from 'src/utils/functions/filter-builder';
import { StatisticsFilterDto } from 'src/utils/dto/statistics-filter.dto';

@Injectable()
export class IntrantStocksService {
  constructor(
    @InjectModel('IntrantStock')
    private intrantStockModel: Model<IntrantStock>,
    @InjectModel('IntrantOrder')
    private intrantOrderModel: Model<any>,
    @InjectModel('Lab') private labModel: Model<any>,
    @InjectModel('Structure') private structureModel: Model<any>,
  ) {}

  async create(
    createIntrantStockDto: CreateIntrantStockDto,
    user: User,
  ): Promise<IntrantStock> {
    try {
      if (user.role !== Role.SuperAdmin) {
        createIntrantStockDto.lab = user.lab ? user.lab.toString() : null;
      }

      const { lab, intrant } = createIntrantStockDto;
      const existing = await this.intrantStockModel.findOne({ lab, intrant });
      if (existing) {
        throw new HttpException(
          'Un stock pour cet intrant existe déjà dans ce laboratoire',
          HttpStatus.CONFLICT,
        );
      }

      if (!createIntrantStockDto.batchNumber) {
        createIntrantStockDto.batchNumber = generateBatchNumber(12);
      }

      return await this.intrantStockModel.create(createIntrantStockDto);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateQuantity(
    lab: string,
    intrant: string,
    quantity: number,
    unit: string,
    batchNumber?: string,
  ): Promise<void> {
    try {
      const stock = await this.intrantStockModel.findOne({ lab, intrant });
      if (stock) {
        stock.initialQuantity += quantity;
        if (batchNumber) stock.batchNumber = batchNumber;
        await stock.save();
      } else {
        await this.intrantStockModel.create({
          lab,
          intrant,
          initialQuantity: quantity,
          unit,
          batchNumber: batchNumber || generateBatchNumber(12),
        });
      }
    } catch (error) {
      logger.error(
        `---INTRANT_STOCKS.SERVICE.UPDATE_QUANTITY ERROR ${error}---`,
      );
    }
  }

  async findAll(query: FindIntrantStockDto): Promise<any> {
    try {
      const { lab, intrant, batchNumber, page = 1, limit = 10, search } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (lab) filters.lab = lab;
      if (intrant) filters.intrant = intrant;
      if (batchNumber) filters.batchNumber = batchNumber;

      if (search) {
        // Recherche dans le numéro de lot
        filters.batchNumber = { $regex: search, $options: 'i' };
      }

      const [data, total] = await Promise.all([
        this.intrantStockModel
          .find(filters)
          .populate('lab', 'name')
          .populate('intrant', 'name code unit')
          .sort({ updated_at: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.intrantStockModel.countDocuments(filters).exec(),
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

  async findOne(id: string): Promise<IntrantStock> {
    try {
      const stock = await this.intrantStockModel
        .findById(id)
        .populate('lab', 'name')
        .populate('intrant', 'name code unit')
        .exec();
      if (!stock)
        throw new HttpException('Stock non trouvé', HttpStatus.NOT_FOUND);
      return stock;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateIntrantStockDto: UpdateIntrantStockDto,
  ): Promise<IntrantStock> {
    try {
      const updated = await this.intrantStockModel
        .findByIdAndUpdate(
          id,
          { ...updateIntrantStockDto, updated_at: new Date() },
          { new: true },
        )
        .exec();
      if (!updated)
        throw new HttpException('Stock non trouvé', HttpStatus.NOT_FOUND);
      return updated;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<IntrantStock> {
    try {
      const deleted = await this.intrantStockModel.findByIdAndDelete(id).exec();
      if (!deleted)
        throw new HttpException('Stock non trouvé', HttpStatus.NOT_FOUND);
      return deleted;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getStatistics(user: User, query: StatisticsFilterDto): Promise<any> {
    try {
      logger.info(`---INTRANT_STOCKS.SERVICE.GET_STATISTICS INIT---`);
      const filters = await buildStatisticsFilters(
        user,
        query,
        this.labModel,
        this.structureModel,
      );

      const [
        totalIntrants,
        totalStockItems,
        lowStockItems,
        byCategory,
        ordersByStatus,
      ] = await Promise.all([
        this.intrantStockModel
          .distinct('intrant', filters)
          .then((res) => res.length),
        this.intrantStockModel.countDocuments(filters),
        this.intrantStockModel.countDocuments({
          ...filters,
          $expr: { $lte: ['$remainingQuantity', '$minThreshold'] },
        }),
        this.intrantStockModel.aggregate([
          { $match: filters },
          {
            $lookup: {
              from: 'intrants',
              localField: 'intrant',
              foreignField: '_id',
              as: 'intrantData',
            },
          },
          { $unwind: '$intrantData' },
          {
            $lookup: {
              from: 'intranttypes',
              localField: 'intrantData.type',
              foreignField: '_id',
              as: 'typeData',
            },
          },
          { $unwind: '$typeData' },
          {
            $lookup: {
              from: 'intrantcategories',
              localField: 'typeData.category',
              foreignField: '_id',
              as: 'categoryData',
            },
          },
          { $unwind: '$categoryData' },
          { $group: { _id: '$categoryData.name', count: { $sum: 1 } } },
        ]),
        this.intrantOrderModel.aggregate([
          { $match: filters },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
      ]);

      logger.info(`---INTRANT_STOCKS.SERVICE.GET_STATISTICS SUCCESS---`);
      return {
        totalIntrants,
        totalStockItems,
        lowStockItems,
        byCategory: byCategory.reduce((acc: any, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        ordersByStatus: Object.values(IntrantOrderStatusEnum).reduce(
          (acc: any, status) => {
            const found = ordersByStatus.find((s) => s._id === status);
            acc[status] = found ? found.count : 0;
            return acc;
          },
          {},
        ),
      };
    } catch (error) {
      logger.error(
        `---INTRANT_STOCKS.SERVICE.GET_STATISTICS ERROR ${error}---`,
      );
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
