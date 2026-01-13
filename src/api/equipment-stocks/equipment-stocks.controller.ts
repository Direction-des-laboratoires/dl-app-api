import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import { EquipmentStocksService } from './equipment-stocks.service';
import { CreateEquipmentStockDto } from './dto/create-equipment-stock.dto';
import { UpdateEquipmentStockDto } from './dto/update-equipment-stock.dto';
import { FindEquipmentStockDto } from './dto/find-equipment-stock.dto';
import logger from 'src/utils/logger';

@Controller('equipment-stocks')
export class EquipmentStocksController {
  constructor(private readonly equipmentStocksService: EquipmentStocksService) {}

  @Post()
  async create(@Body() createEquipmentStockDto: CreateEquipmentStockDto, @Req() req, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_STOCKS.CONTROLLER.CREATE INIT---`);
      const user = req.user;
      const stock = await this.equipmentStocksService.create(createEquipmentStockDto, user);
      logger.info(`---EQUIPMENT_STOCKS.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Stock créé avec succès',
        data: stock,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_STOCKS.CONTROLLER.CREATE ERROR ${error}---`);
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindEquipmentStockDto, @Req() req, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_STOCKS.CONTROLLER.FIND_ALL INIT---`);
      const user = req.user;
      const result = await this.equipmentStocksService.findAll(query, user);
      logger.info(`---EQUIPMENT_STOCKS.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des stocks',
        ...result,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_STOCKS.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_STOCKS.CONTROLLER.FIND_ONE INIT--- id=${id}`);
      const stock = await this.equipmentStocksService.findOne(id);
      logger.info(`---EQUIPMENT_STOCKS.CONTROLLER.FIND_ONE SUCCESS--- id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: `Stock ${id}`,
        data: stock,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_STOCKS.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateEquipmentStockDto: UpdateEquipmentStockDto, @Req() req, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_STOCKS.CONTROLLER.UPDATE INIT--- id=${id}`);
      const user = req.user;
      const stock = await this.equipmentStocksService.update(id, updateEquipmentStockDto, user);
      logger.info(`---EQUIPMENT_STOCKS.CONTROLLER.UPDATE SUCCESS--- id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: `Stock ${id} mis à jour`,
        data: stock,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_STOCKS.CONTROLLER.UPDATE ERROR ${error}---`);
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_STOCKS.CONTROLLER.REMOVE INIT--- id=${id}`);
      const deleted = await this.equipmentStocksService.remove(id);
      logger.info(`---EQUIPMENT_STOCKS.CONTROLLER.REMOVE SUCCESS--- id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: `Stock ${id} supprimé`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_STOCKS.CONTROLLER.REMOVE ERROR ${error}---`);
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
}
