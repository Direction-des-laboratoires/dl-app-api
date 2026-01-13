import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IntrantOrder } from './interfaces/intrant-order.interface';
import { CreateIntrantOrderDto } from './dto/create-intrant-order.dto';
import { UpdateIntrantOrderDto } from './dto/update-intrant-order.dto';
import { FindIntrantOrderDto } from './dto/find-intrant-order.dto';
import { IntrantOrderStatusEnum } from './schemas/intrant-order.schema';
import { IntrantStocksService } from '../intrant-stocks/intrant-stocks.service';
import logger from 'src/utils/logger';
import { User } from '../user/interfaces/user.interface';
import { Role } from 'src/utils/enums/roles.enum';
import { generateBatchNumber } from 'src/utils/functions/code_generation';

@Injectable()
export class IntrantOrdersService {
  constructor(
    @InjectModel('IntrantOrder')
    private intrantOrderModel: Model<IntrantOrder>,
    private intrantStocksService: IntrantStocksService,
  ) {}

  async create(
    createIntrantOrderDto: CreateIntrantOrderDto,
    user: User,
  ): Promise<IntrantOrder> {
    try {
      logger.info(`---INTRANT_ORDERS.SERVICE.CREATE INIT---`);

      if (user.role !== Role.SuperAdmin) {
        createIntrantOrderDto.lab = user.lab ? user.lab.toString() : null;
      }

      const batchNumber = generateBatchNumber(12);

      const order = await this.intrantOrderModel.create({
        ...createIntrantOrderDto,
        batchNumber,
      });

      if (order.status === IntrantOrderStatusEnum.COMPLETED) {
        await this.intrantStocksService.updateQuantity(
          order.lab.toString(),
          order.intrant.toString(),
          order.quantity,
          order.unit,
          order.batchNumber,
        );
      }

      await order.populate('lab', 'name');
      await order.populate('supplier', 'name');
      await order.populate('intrant', 'name code');
      await order.populate(
        'validatedBy',
        'firstname lastname phoneNumber email',
      );
      await order.populate(
        'completedBy',
        'firstname lastname phoneNumber email',
      );

      logger.info(`---INTRANT_ORDERS.SERVICE.CREATE SUCCESS---`);
      return order;
    } catch (error) {
      logger.error(`---INTRANT_ORDERS.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindIntrantOrderDto): Promise<any> {
    try {
      const {
        lab,
        intrant,
        supplier,
        status,
        batchNumber,
        search,
        page = 1,
        limit = 10,
      } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (lab) filters.lab = lab;
      if (intrant) filters.intrant = intrant;
      if (supplier) filters.supplier = supplier;
      if (status) filters.status = status;
      if (batchNumber) filters.batchNumber = batchNumber;

      if (search) {
        filters.$or = [
          { notes: { $regex: search, $options: 'i' } },
          { batchNumber: { $regex: search, $options: 'i' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.intrantOrderModel
          .find(filters)
          .populate('lab', 'name')
          .populate('supplier', 'name')
          .populate('intrant', 'name code')
          .populate('validatedBy', 'firstname lastname phoneNumber email')
          .populate('completedBy', 'firstname lastname phoneNumber email')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.intrantOrderModel.countDocuments(filters).exec(),
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

  async findOne(id: string): Promise<IntrantOrder> {
    try {
      const order = await this.intrantOrderModel
        .findById(id)
        .populate('lab', 'name')
        .populate('supplier', 'name')
        .populate('intrant', 'name code')
        .populate('validatedBy', 'firstname lastname phoneNumber email')
        .populate('completedBy', 'firstname lastname phoneNumber email')
        .exec();
      if (!order) {
        throw new HttpException('Commande non trouvée', HttpStatus.NOT_FOUND);
      }
      return order;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateIntrantOrderDto: UpdateIntrantOrderDto,
    user: User,
  ): Promise<IntrantOrder> {
    try {
      const current = await this.intrantOrderModel.findById(id);
      if (!current)
        throw new HttpException('Commande non trouvée', HttpStatus.NOT_FOUND);

      if (current.status === IntrantOrderStatusEnum.COMPLETED) {
        throw new HttpException(
          'Une commande déjà complétée ne peut plus être modifiée',
          HttpStatus.BAD_REQUEST,
        );
      }

      const oldStatus = current.status;
      const newStatus = updateIntrantOrderDto.status;

      const updateData: any = {
        ...updateIntrantOrderDto,
        updated_at: new Date(),
      };

      if (
        newStatus === IntrantOrderStatusEnum.VALIDATED &&
        oldStatus !== IntrantOrderStatusEnum.VALIDATED
      ) {
        updateData.validatedBy = user._id;
      }

      if (newStatus === IntrantOrderStatusEnum.COMPLETED) {
        updateData.completedBy = user._id;
      }

      const updated = await this.intrantOrderModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('lab', 'name')
        .populate('supplier', 'name')
        .populate('intrant', 'name code')
        .populate('validatedBy', 'firstname lastname phoneNumber email')
        .populate('completedBy', 'firstname lastname phoneNumber email')
        .exec();

      // Logique de stock
      if (newStatus === IntrantOrderStatusEnum.COMPLETED) {
        await this.intrantStocksService.updateQuantity(
          current.lab.toString(),
          current.intrant.toString(),
          current.quantity,
          current.unit,
          current.batchNumber,
        );
      }

      return updated;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<IntrantOrder> {
    try {
      const order = await this.intrantOrderModel.findById(id);
      if (!order)
        throw new HttpException('Commande non trouvée', HttpStatus.NOT_FOUND);

      if (order.status === IntrantOrderStatusEnum.COMPLETED) {
        await this.intrantStocksService.updateQuantity(
          order.lab.toString(),
          order.intrant.toString(),
          -order.quantity,
          order.unit,
        );
      }

      return await this.intrantOrderModel.findByIdAndDelete(id).exec();
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
