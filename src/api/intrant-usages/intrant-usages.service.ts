import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IntrantUsage } from './interfaces/intrant-usage.interface';
import { CreateIntrantUsageDto } from './dto/create-intrant-usage.dto';
import { UpdateIntrantUsageDto } from './dto/update-intrant-usage.dto';
import { FindIntrantUsageDto } from './dto/find-intrant-usage.dto';
import { IntrantStock } from '../intrant-stocks/interfaces/intrant-stock.interface';
import { User } from '../user/interfaces/user.interface';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';

@Injectable()
export class IntrantUsagesService {
  constructor(
    @InjectModel('IntrantUsage')
    private intrantUsageModel: Model<IntrantUsage>,
    @InjectModel('IntrantStock')
    private intrantStockModel: Model<IntrantStock>,
  ) {}

  async create(
    createIntrantUsageDto: CreateIntrantUsageDto,
    user: User,
  ): Promise<IntrantUsage> {
    try {
      logger.info(`---INTRANT_USAGES.SERVICE.CREATE INIT---`);

      if (user.role !== Role.SuperAdmin) {
        createIntrantUsageDto.lab = user.lab ? user.lab.toString() : null;
      }

      if (!createIntrantUsageDto.usedBy) {
        createIntrantUsageDto.usedBy = user._id.toString();
      }

      const { lab, intrant, quantity } = createIntrantUsageDto;

      // 1. Vérifier le stock
      const stock = await this.intrantStockModel.findOne({ lab, intrant });
      if (!stock) {
        throw new HttpException(
          'Aucun stock trouvé pour cet intrant dans ce laboratoire',
          HttpStatus.NOT_FOUND,
        );
      }

      if (stock.remainingQuantity < quantity) {
        throw new HttpException(
          `Stock insuffisant. Quantité restante : ${stock.remainingQuantity}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 2. Créer l'usage
      const usage = await this.intrantUsageModel.create(createIntrantUsageDto);

      // 3. Mettre à jour le stock
      stock.usedQuantity += quantity;
      await stock.save();

      await usage.populate('lab', 'name');
      await usage.populate('intrant', 'name code');
      await usage.populate('usedBy', 'firstname lastname');

      logger.info(`---INTRANT_USAGES.SERVICE.CREATE SUCCESS---`);
      return usage;
    } catch (error) {
      logger.error(`---INTRANT_USAGES.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindIntrantUsageDto): Promise<any> {
    try {
      const {
        lab,
        intrant,
        usedBy,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        search,
      } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (lab) filters.lab = lab;
      if (intrant) filters.intrant = intrant;
      if (usedBy) filters.usedBy = usedBy;

      if (startDate || endDate) {
        filters.usageDate = {};
        if (startDate) filters.usageDate.$gte = new Date(startDate);
        if (endDate) filters.usageDate.$lte = new Date(endDate);
      }

      if (search) {
        filters.notes = { $regex: search, $options: 'i' };
      }

      const [data, total] = await Promise.all([
        this.intrantUsageModel
          .find(filters)
          .populate('lab', 'name')
          .populate('intrant', 'name code unit')
          .populate('usedBy', 'firstname lastname')
          .sort({ usageDate: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.intrantUsageModel.countDocuments(filters).exec(),
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

  async findOne(id: string): Promise<IntrantUsage> {
    try {
      const usage = await this.intrantUsageModel
        .findById(id)
        .populate('lab', 'name')
        .populate('intrant', 'name code unit')
        .populate('usedBy', 'firstname lastname')
        .exec();
      if (!usage) {
        throw new HttpException('Usage non trouvé', HttpStatus.NOT_FOUND);
      }
      return usage;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateIntrantUsageDto: UpdateIntrantUsageDto,
  ): Promise<IntrantUsage> {
    try {
      const currentUsage = await this.intrantUsageModel.findById(id);
      if (!currentUsage) {
        throw new HttpException('Usage non trouvé', HttpStatus.NOT_FOUND);
      }

      // Si la quantité change, on doit mettre à jour le stock
      if (
        updateIntrantUsageDto.quantity !== undefined &&
        updateIntrantUsageDto.quantity !== currentUsage.quantity
      ) {
        const stock = await this.intrantStockModel.findOne({
          lab: currentUsage.lab,
          intrant: currentUsage.intrant,
        });

        if (!stock) {
          throw new HttpException(
            'Stock non trouvé pour cet intrant',
            HttpStatus.NOT_FOUND,
          );
        }

        const diff = updateIntrantUsageDto.quantity - currentUsage.quantity;

        if (stock.remainingQuantity < diff) {
          throw new HttpException(
            `Stock insuffisant pour cette modification. Quantité restante : ${stock.remainingQuantity}`,
            HttpStatus.BAD_REQUEST,
          );
        }

        stock.usedQuantity += diff;
        await stock.save();
      }

      const updated = await this.intrantUsageModel
        .findByIdAndUpdate(
          id,
          { ...updateIntrantUsageDto, updated_at: new Date() },
          { new: true },
        )
        .populate('lab', 'name')
        .populate('intrant', 'name code unit')
        .populate('usedBy', 'firstname lastname')
        .exec();

      return updated;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<IntrantUsage> {
    try {
      const usage = await this.intrantUsageModel.findById(id);
      if (!usage) {
        throw new HttpException('Usage non trouvé', HttpStatus.NOT_FOUND);
      }

      // Restaurer le stock
      const stock = await this.intrantStockModel.findOne({
        lab: usage.lab,
        intrant: usage.intrant,
      });
      if (stock) {
        stock.usedQuantity -= usage.quantity;
        if (stock.usedQuantity < 0) stock.usedQuantity = 0;
        await stock.save();
      }

      return await this.intrantUsageModel.findByIdAndDelete(id).exec();
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

