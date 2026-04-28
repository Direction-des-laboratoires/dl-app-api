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
import { EquipmentsService } from './equipments.service';
import { EquipmentLifeEventsService } from '../equipment-life-events/equipment-life-events.service';
import { FindEquipmentLifeEventDto } from '../equipment-life-events/dto/find-equipment-life-event.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { CreateEquipmentsBulkDto } from './dto/create-equipments-bulk.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { FindEquipmentDto } from './dto/find-equipment.dto';
import { StatisticsFilterDto } from 'src/utils/dto/statistics-filter.dto';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';

@Controller('equipments')
export class EquipmentsController {
  constructor(
    private readonly equipmentsService: EquipmentsService,
    private readonly equipmentLifeEventsService: EquipmentLifeEventsService,
  ) {}

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Post()
  async create(
    @Body() createEquipmentDto: CreateEquipmentDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---EQUIPMENTS.CONTROLLER.CREATE INIT---`);
      const equipment = await this.equipmentsService.create(
        createEquipmentDto,
        req.user,
      );
      logger.info(`---EQUIPMENTS.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Équipement créé avec succès',
        data: equipment,
      });
    } catch (error) {
      logger.error(`---EQUIPMENTS.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Post('bulk')
  async createBulk(
    @Body() body: CreateEquipmentsBulkDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(
        `---EQUIPMENTS.CONTROLLER.CREATE_BULK INIT--- count=${body.equipments.length}`,
      );
      const result = await this.equipmentsService.createBulk(
        body.equipments,
        req.user,
      );
      logger.info(
        `---EQUIPMENTS.CONTROLLER.CREATE_BULK SUCCESS--- ok=${result.successCount} ko=${result.failedCount}`,
      );
      if (result.successCount === 0) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Aucun équipement créé',
          data: result,
        });
      }
      return res.status(HttpStatus.CREATED).json({
        message: `${result.successCount} équipement(s) créé(s)${
          result.failedCount > 0
            ? `, ${result.failedCount} échec(s)`
            : ''
        }`,
        data: result,
      });
    } catch (error) {
      logger.error(`---EQUIPMENTS.CONTROLLER.CREATE_BULK ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindEquipmentDto, @Req() req, @Res() res) {
    try {
      logger.info(`---EQUIPMENTS.CONTROLLER.FIND_ALL INIT---`);
      const user = req.user;
      const result = await this.equipmentsService.findAll(query, user);
      logger.info(`---EQUIPMENTS.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des équipements',
        ...result,
      });
    } catch (error) {
      logger.error(`---EQUIPMENTS.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get('statistics')
  async getStatistics(@Query() query: StatisticsFilterDto, @Req() req, @Res() res) {
    try {
      logger.info(`---EQUIPMENTS.CONTROLLER.GET_STATISTICS INIT---`);
      const stats = await this.equipmentsService.getStatistics(req.user, query);
      logger.info(`---EQUIPMENTS.CONTROLLER.GET_STATISTICS SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Statistiques des équipements récupérées avec succès',
        data: stats,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT.CONTROLLER.GET_STATISTICS ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.LabStaff, Role.Technician)
  @Get(':id/life-events')
  async getLifeEvents(
    @Param('id') id: string,
    @Query() query: FindEquipmentLifeEventDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---EQUIPMENTS.CONTROLLER.LIFE_EVENTS INIT--- id=${id}`);
      const result = await this.equipmentLifeEventsService.findAll(
        { ...query, equipment: id },
        req.user,
      );
      logger.info(`---EQUIPMENTS.CONTROLLER.LIFE_EVENTS SUCCESS--- id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: 'Fiche de vie de l’équipement',
        ...result,
      });
    } catch (error) {
      logger.error(`---EQUIPMENTS.CONTROLLER.LIFE_EVENTS ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---EQUIPMENTS.CONTROLLER.FIND_ONE INIT--- id=${id}`);
      const equipment = await this.equipmentsService.findOne(id);
      logger.info(`---EQUIPMENTS.CONTROLLER.FIND_ONE SUCCESS--- id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: `Équipement ${id}`,
        data: equipment,
      });
    } catch (error) {
      logger.error(`---EQUIPMENTS.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---EQUIPMENTS.CONTROLLER.UPDATE INIT--- id=${id}`);
      const updated = await this.equipmentsService.update(
        id,
        updateEquipmentDto,
        req.user,
      );
      logger.info(`---EQUIPMENTS.CONTROLLER.UPDATE SUCCESS--- id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: `Équipement ${id} mis à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---EQUIPMENTS.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req, @Res() res) {
    try {
      logger.info(`---EQUIPMENTS.CONTROLLER.REMOVE INIT--- id=${id}`);
      const deleted = await this.equipmentsService.remove(
        id,
        req.user?._id?.toString(),
      );
      logger.info(`---EQUIPMENTS.CONTROLLER.REMOVE SUCCESS--- id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: `Équipement ${id} supprimé`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---EQUIPMENTS.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Post(':id/receive')
  async receive(
    @Param('id') id: string,
    @Body('receivedDate') receivedDate: Date,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---EQUIPMENTS.CONTROLLER.RECEIVE INIT--- id=${id}`);
      const result = await this.equipmentsService.receive(
        id,
        req.user._id,
        receivedDate,
      );
      logger.info(`---EQUIPMENTS.CONTROLLER.RECEIVE SUCCESS--- id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: 'Équipement reçu et marqué comme disponible',
        data: result,
      });
    } catch (error) {
      logger.error(`---EQUIPMENTS.CONTROLLER.RECEIVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
