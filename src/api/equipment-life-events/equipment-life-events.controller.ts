import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  Res,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { EquipmentLifeEventsService } from './equipment-life-events.service';
import { FindEquipmentLifeEventDto } from './dto/find-equipment-life-event.dto';
import { CreateManualLifeEventDto } from './dto/create-manual-life-event.dto';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';

@Controller('equipment-life-events')
export class EquipmentLifeEventsController {
  constructor(
    private readonly equipmentLifeEventsService: EquipmentLifeEventsService,
  ) {}

  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.LabStaff, Role.Technician)
  @Get()
  async findAll(@Query() query: FindEquipmentLifeEventDto, @Req() req, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_LIFE_EVENTS.CONTROLLER.FIND_ALL INIT---`);
      const result = await this.equipmentLifeEventsService.findAll(
        query,
        req.user,
      );
      logger.info(`---EQUIPMENT_LIFE_EVENTS.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Événements de cycle de vie',
        ...result,
      });
    } catch (error) {
      logger.error(
        `---EQUIPMENT_LIFE_EVENTS.CONTROLLER.FIND_ALL ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.LabStaff, Role.Technician)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_LIFE_EVENTS.CONTROLLER.FIND_ONE INIT---`);
      const data = await this.equipmentLifeEventsService.findOne(id, req.user);
      logger.info(`---EQUIPMENT_LIFE_EVENTS.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Événement de cycle de vie',
        data,
      });
    } catch (error) {
      logger.error(
        `---EQUIPMENT_LIFE_EVENTS.CONTROLLER.FIND_ONE ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.LabStaff, Role.Technician)
  @Post()
  async createManual(
    @Body() dto: CreateManualLifeEventDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---EQUIPMENT_LIFE_EVENTS.CONTROLLER.CREATE_MANUAL INIT---`);
      const data = await this.equipmentLifeEventsService.createManual(
        dto,
        req.user,
        req.user?._id?.toString(),
      );
      logger.info(
        `---EQUIPMENT_LIFE_EVENTS.CONTROLLER.CREATE_MANUAL SUCCESS---`,
      );
      return res.status(HttpStatus.CREATED).json({
        message: 'Entrée ajoutée à la fiche de vie',
        data,
      });
    } catch (error) {
      logger.error(
        `---EQUIPMENT_LIFE_EVENTS.CONTROLLER.CREATE_MANUAL ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_LIFE_EVENTS.CONTROLLER.REMOVE INIT---`);
      await this.equipmentLifeEventsService.remove(id, req.user);
      logger.info(`---EQUIPMENT_LIFE_EVENTS.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Événement supprimé',
      });
    } catch (error) {
      logger.error(
        `---EQUIPMENT_LIFE_EVENTS.CONTROLLER.REMOVE ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
