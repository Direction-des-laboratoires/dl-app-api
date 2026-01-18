import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { EquipmentOrdersService } from './equipment-orders.service';
import { CreateEquipmentOrderDto } from './dto/create-equipment-order.dto';
import { UpdateEquipmentOrderDto } from './dto/update-equipment-order.dto';
import { FindEquipmentOrderDto } from './dto/find-equipment-order.dto';
import { StatisticsFilterDto } from 'src/utils/dto/statistics-filter.dto';
import logger from 'src/utils/logger';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';

@Controller('equipment-orders')
export class EquipmentOrdersController {
  constructor(
    private readonly equipmentOrdersService: EquipmentOrdersService,
  ) {}

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Post()
  async create(
    @Body() createEquipmentOrderDto: CreateEquipmentOrderDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---EQUIPMENT_ORDERS.CONTROLLER.CREATE INIT---`);
      const user = req.user;
      const order = await this.equipmentOrdersService.create(
        createEquipmentOrderDto,
        user,
      );
      logger.info(`---EQUIPMENT_ORDERS.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Commande créée avec succès',
        data: order,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_ORDERS.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.LabStaff)
  @Get()
  async findAll(@Query() query: FindEquipmentOrderDto, @Req() req, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_ORDERS.CONTROLLER.FIND_ALL INIT---`);
      const user = req.user;
      const result = await this.equipmentOrdersService.findAll(query, user);
      logger.info(`---EQUIPMENT_ORDERS.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des commandes',
        ...result,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_ORDERS.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.LabStaff)
  @Get('statistics')
  async getStatistics(@Query() query: StatisticsFilterDto, @Req() req, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_ORDERS.CONTROLLER.GET_STATISTICS INIT---`);
      const user = req.user;
      const stats = await this.equipmentOrdersService.getStatistics(user, query);
      logger.info(`---EQUIPMENT_ORDERS.CONTROLLER.GET_STATISTICS SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Statistiques des commandes récupérées avec succès',
        data: stats,
      });
    } catch (error) {
      logger.error(
        `---EQUIPMENT_ORDERS.CONTROLLER.GET_STATISTICS ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.LabStaff)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_ORDERS.CONTROLLER.FIND_ONE INIT--- id=${id}`);
      const order = await this.equipmentOrdersService.findOne(id);
      logger.info(
        `---EQUIPMENT_ORDERS.CONTROLLER.FIND_ONE SUCCESS--- id=${id}`,
      );
      return res.status(HttpStatus.OK).json({
        message: 'Commande récupérée avec succès',
        data: order,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_ORDERS.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEquipmentOrderDto: UpdateEquipmentOrderDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---EQUIPMENT_ORDERS.CONTROLLER.UPDATE INIT--- id=${id}`);
      const user = req.user;
      const updated = await this.equipmentOrdersService.update(
        id,
        updateEquipmentOrderDto,
        user,
      );
      logger.info(`---EQUIPMENT_ORDERS.CONTROLLER.UPDATE SUCCESS--- id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: 'Commande mise à jour avec succès',
        data: updated,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_ORDERS.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_ORDERS.CONTROLLER.REMOVE INIT--- id=${id}`);
      const deleted = await this.equipmentOrdersService.remove(id);
      logger.info(`---EQUIPMENT_ORDERS.CONTROLLER.REMOVE SUCCESS--- id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: 'Commande supprimée avec succès',
        data: deleted,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_ORDERS.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
