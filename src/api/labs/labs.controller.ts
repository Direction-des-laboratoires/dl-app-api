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
} from '@nestjs/common';
import { LabsService } from './labs.service';
import { CreateLabDto } from './dto/create-lab.dto';
import { CreateMultipleLabsDto } from './dto/create-multiple-labs.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { FindLabsDto } from './dto/find-lab.dto';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';

@Controller('labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Post()
  async create(@Body() createLabDto: CreateLabDto, @Res() res) {
    try {
      logger.info(`---LABS.CONTROLLER.CREATE INIT---`);
      const lab = await this.labsService.create(createLabDto);
      logger.info(`---LABS.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Laboratoire créé',
        data: lab,
      });
    } catch (error) {
      logger.error(`---LABS.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Post('multiple')
  async createMultiple(
    @Body() createMultipleLabsDto: CreateMultipleLabsDto,
    @Res() res,
  ) {
    try {
      logger.info(
        `---LABS.CONTROLLER.CREATE_MULTIPLE INIT--- count=${createMultipleLabsDto.labs.length}`,
      );
      const result = await this.labsService.createMultiple(
        createMultipleLabsDto.labs,
      );
      logger.info(
        `---LABS.CONTROLLER.CREATE_MULTIPLE SUCCESS--- created=${result.successCount}, failed=${result.failedCount}`,
      );
      return res.status(HttpStatus.CREATED).json({
        message: `${result.successCount} laboratoire(s) créé(s) avec succès${
          result.failedCount > 0 ? `, ${result.failedCount} échec(s)` : ''
        }`,
        data: result.labs,
        successCount: result.successCount,
        failedCount: result.failedCount,
        totalCount: result.totalCount,
      });
    } catch (error: any) {
      logger.error(`---LABS.CONTROLLER.CREATE_MULTIPLE ERROR ${error}---`);
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message || 'Erreur lors de la création des laboratoires',
        ...(error.response && { errors: error.response.errors }),
        ...(error.response && { successCount: error.response.successCount }),
        ...(error.response && { failedCount: error.response.failedCount }),
        ...(error.response && { totalCount: error.response.totalCount }),
      });
    }
  }

  @Roles(Role.SuperAdmin)
  @Post('bulk-with-managers')
  async createBulkWithManagers(@Body() payload: any[], @Res() res) {
    try {
      logger.info(
        `---LABS.CONTROLLER.CREATE_BULK_WITH_MANAGERS INIT--- count=${payload?.length || 0}`,
      );
      const result = await this.labsService.createBulkWithManagers(payload || []);
      logger.info(`---LABS.CONTROLLER.CREATE_BULK_WITH_MANAGERS SUCCESS---`);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error: any) {
      logger.error(`---LABS.CONTROLLER.CREATE_BULK_WITH_MANAGERS ERROR ${error}---`);
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        message:
          error.message ||
          'Erreur lors de la création bulk des laboratoires et responsables',
      });
    }
  }

  @Get()
  async findAll(@Query() query: FindLabsDto, @Res() res) {
    try {
      const result = await this.labsService.findAll(query);
      const response: any = {
        message: 'Liste des laboratoires',
        data: result.data,
      };
      if (query.paginate !== false) {
        response.pagination = {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        };
      }

      return res.status(HttpStatus.OK).json(response);
    } catch (error: any) {
      return res.status(error.status || 500).json({
        message: error.message || 'Erreur serveur',
      });
    }
  }

  @Roles(Role.SuperAdmin)
  @Get('stats-by-region')
  async getNumberOfLabsGroupByRegion(@Res() res) {
    try {
      const groupByRegion = await this.labsService.countLabsByRegion();
      return res.status(HttpStatus.OK).json({
        message: 'Nombre de Laboratoires par région',
        data: groupByRegion,
      });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        message: error.message || 'Erreur serveur',
      });
    }
  }

  @Roles(Role.SuperAdmin)
  @Get('region/:regionId')
  async getLabsByRegion(
    @Query() query: FindLabsDto,
    @Param('regionId') regionId: string,
    @Res() res,
  ) {
    try {
      const groupByRegion = await this.labsService.findLabsByRegion(
        regionId,
        query,
      );
      const response: any = {
        message: 'Nombre de Laboratoires par région',
        data: groupByRegion.data,
      };
      if (query.paginate !== false) {
        response.pagination = {
          total: groupByRegion.total,
          page: groupByRegion.page,
          limit: groupByRegion.limit,
          totalPages: groupByRegion.totalPages,
        };
      }
      return res.status(HttpStatus.OK).json(response);
    } catch (error: any) {
      return res.status(error.status || 500).json({
        message: error.message || 'Erreur serveur',
      });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      const lab = await this.labsService.findOne(id);
      return res.status(HttpStatus.OK).json({
        message: 'Laboratoire recupéré',
        data: lab,
      });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        message: error.message || 'Erreur serveur',
      });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLabDto: UpdateLabDto,
    @Res() res,
  ) {
    try {
      logger.info(`---LABS.CONTROLLER.UPDATE INIT---`);
      const updated = await this.labsService.update(id, updateLabDto);
      logger.info(`---LABS.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Laboratoire ${id} mis à jour`,
        data: updated,
      });
    } catch (error: any) {
      logger.error(`---LABS.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---LABS.CONTROLLER.REMOVE INIT---`);
      const deleted = await this.labsService.remove(id);
      logger.info(`---LABS.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Laboratoire ${id} supprimé`,
        data: deleted,
      });
    } catch (error: any) {
      logger.error(`---LABS.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
