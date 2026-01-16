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
import { MaintenancesService } from './maintenances.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { FindMaintenanceDto } from './dto/find-maintenance.dto';
import logger from 'src/utils/logger';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';

@Controller('maintenances')
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Post()
  async create(@Body() createMaintenanceDto: CreateMaintenanceDto, @Res() res) {
    try {
      logger.info(`---MAINTENANCES.CONTROLLER.CREATE INIT---`);
      const maintenance = await this.maintenancesService.create(
        createMaintenanceDto,
      );
      logger.info(`---MAINTENANCES.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Enregistrement de maintenance créé avec succès',
        data: maintenance,
      });
    } catch (error) {
      logger.error(`---MAINTENANCES.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.LabStaff, Role.Technician)
  @Get()
  async findAll(@Query() query: FindMaintenanceDto, @Res() res) {
    try {
      logger.info(`---MAINTENANCES.CONTROLLER.FIND_ALL INIT---`);
      const result = await this.maintenancesService.findAll(query);
      logger.info(`---MAINTENANCES.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des enregistrements de maintenance',
        ...result,
      });
    } catch (error) {
      logger.error(`---MAINTENANCES.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.LabStaff, Role.Technician)
  @Get('statistics')
  async getStatistics(@Req() req, @Res() res) {
    try {
      logger.info(`---MAINTENANCES.CONTROLLER.GET_STATISTICS INIT---`);
      const stats = await this.maintenancesService.getStatistics(req.user);
      logger.info(`---MAINTENANCES.CONTROLLER.GET_STATISTICS SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Statistiques des maintenances récupérées avec succès',
        data: stats,
      });
    } catch (error) {
      logger.error(
        `---MAINTENANCES.CONTROLLER.GET_STATISTICS ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.LabStaff, Role.Technician)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---MAINTENANCES.CONTROLLER.FIND_ONE INIT---`);
      const maintenance = await this.maintenancesService.findOne(id);
      logger.info(`---MAINTENANCES.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Enregistrement de maintenance ${id}`,
        data: maintenance,
      });
    } catch (error) {
      logger.error(`---MAINTENANCES.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.Technician)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMaintenanceDto: UpdateMaintenanceDto,
    @Res() res,
  ) {
    try {
      logger.info(`---MAINTENANCES.CONTROLLER.UPDATE INIT---`);
      const updated = await this.maintenancesService.update(
        id,
        updateMaintenanceDto,
      );
      logger.info(`---MAINTENANCES.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Enregistrement de maintenance ${id} mis à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---MAINTENANCES.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---MAINTENANCES.CONTROLLER.REMOVE INIT---`);
      const deleted = await this.maintenancesService.remove(id);
      logger.info(`---MAINTENANCES.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Enregistrement de maintenance ${id} supprimé`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---MAINTENANCES.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
