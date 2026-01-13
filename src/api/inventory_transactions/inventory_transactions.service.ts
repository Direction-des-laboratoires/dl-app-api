import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateInventoryTransactionDto } from './dto/create-inventory_transaction.dto';
import { UpdateInventoryTransactionDto } from './dto/update-inventory_transaction.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InventoryTransaction } from './entities/inventory_transaction.entity';
import logger from 'src/utils/logger';

@Injectable()
export class InventoryTransactionsService {
  constructor(
    @InjectModel('InventoryTransaction')
    private inventoryTransactionModel: Model<InventoryTransaction>,
  ) {}

  async create(createInventoryTransactionDto: CreateInventoryTransactionDto) {
    try {
      logger.info(`---INVENTORY_TRANSACTIONS.SERVICE.CREATE INIT---`);
      const inventoryTransaction = await this.inventoryTransactionModel.create(
        createInventoryTransactionDto,
      );
      await inventoryTransaction.populate('equipmentType', 'name serialNumber');
      await inventoryTransaction.populate(
        'user',
        'firstname lastname phoneNumber email',
      );
      logger.info(`---INVENTORY_TRANSACTIONS.SERVICE.CREATE SUCCESS---`);
      return inventoryTransaction;
    } catch (error) {
      logger.error(
        `---INVENTORY_TRANSACTIONS.SERVICE.CREATE ERROR ${error}---`,
      );
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll() {
    try {
      logger.info(`---INVENTORY_TRANSACTIONS.SERVICE.FIND_ALL INIT---`);
      const inventoryTransactions = await this.inventoryTransactionModel
        .find()
        .populate('equipmentType', 'name serialNumber')
        .populate('user', 'firstname lastname phoneNumber email')
        .sort({ created_at: -1 })
        .exec();
      logger.info(`---INVENTORY_TRANSACTIONS.SERVICE.FIND_ALL SUCCESS---`);
      return inventoryTransactions;
    } catch (error) {
      logger.error(
        `---INVENTORY_TRANSACTIONS.SERVICE.FIND_ALL ERROR ${error}---`,
      );
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---INVENTORY_TRANSACTIONS.SERVICE.FIND_ONE INIT---`);
      const inventoryTransaction = await this.inventoryTransactionModel
        .findById(id)
        .populate('equipmentType', 'name serialNumber')
        .populate('user', 'firstname lastname phoneNumber email')
        .exec();
      if (!inventoryTransaction) {
        throw new HttpException(
          "Transaction d'inventaire non trouvée",
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---INVENTORY_TRANSACTIONS.SERVICE.FIND_ONE SUCCESS---`);
      return inventoryTransaction;
    } catch (error) {
      logger.error(
        `---INVENTORY_TRANSACTIONS.SERVICE.FIND_ONE ERROR ${error}---`,
      );
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateInventoryTransactionDto: UpdateInventoryTransactionDto,
  ) {
    try {
      logger.info(`---INVENTORY_TRANSACTIONS.SERVICE.UPDATE INIT---`);
      const updated = await this.inventoryTransactionModel
        .findByIdAndUpdate(
          id,
          { ...updateInventoryTransactionDto, updated_at: new Date() },
          { new: true },
        )
        .populate('equipmentType', 'name serialNumber')
        .populate('user', 'firstname lastname phoneNumber email')
        .exec();
      if (!updated) {
        throw new HttpException(
          "Transaction d'inventaire non trouvée",
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---INVENTORY_TRANSACTIONS.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(
        `---INVENTORY_TRANSACTIONS.SERVICE.UPDATE ERROR ${error}---`,
      );
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---INVENTORY_TRANSACTIONS.SERVICE.REMOVE INIT---`);
      const deleted = await this.inventoryTransactionModel
        .findByIdAndDelete(id)
        .exec();
      if (!deleted) {
        throw new HttpException(
          "Transaction d'inventaire non trouvée",
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---INVENTORY_TRANSACTIONS.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(
        `---INVENTORY_TRANSACTIONS.SERVICE.REMOVE ERROR ${error}---`,
      );
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
