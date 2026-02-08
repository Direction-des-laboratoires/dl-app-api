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
import { StructureLevelService } from './structure-level.service';
import { CreateStructureLevelDto } from './dto/create-structure-level.dto';
import { UpdateStructureLevelDto } from './dto/update-structure-level.dto';
import logger from 'src/utils/logger';

@Controller('structure-levels')
export class StructureLevelController {
  constructor(private readonly structureLevelService: StructureLevelService) {}

  @Post()
  async create(
    @Body() createStructureLevelDto: CreateStructureLevelDto,
    @Res() res,
  ) {
    try {
      logger.info(`---STRUCTURE_LEVEL.CONTROLLER.CREATE INIT---`);
      const level = await this.structureLevelService.create(
        createStructureLevelDto,
      );
      logger.info(`---STRUCTURE_LEVEL.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Niveau de structure créé',
        data: level,
      });
    } catch (error) {
      logger.error(`---STRUCTURE_LEVEL.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Post('seeds')
  async createMany(@Res() res) {
    try {
      logger.info(`---STRUCTURE_LEVEL.CONTROLLER.CREATE_MANY INIT---`);
      const levels = await this.structureLevelService.createMany();
      logger.info(`---STRUCTURE_LEVEL.CONTROLLER.CREATE_MANY SUCCESS---`);
      return res
        .status(HttpStatus.CREATED)
        .json({ message: 'Niveaux de structure créés', data: levels });
    } catch (error) {
      logger.error(
        `---STRUCTURE_LEVEL.CONTROLLER.CREATE_MANY ERROR ${error}---`,
      );
      return res.status(error.status).json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Res() res, @Query('status') status?: string) {
    try {
      logger.info(`---STRUCTURE_LEVEL.CONTROLLER.FIND_ALL INIT---`);
      const levels = await this.structureLevelService.findAll({ status });
      logger.info(`---STRUCTURE_LEVEL.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des niveaux de structure',
        data: levels,
      });
    } catch (error) {
      logger.error(`---STRUCTURE_LEVEL.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---STRUCTURE_LEVEL.CONTROLLER.FIND_ONE INIT---`);
      const level = await this.structureLevelService.findOne(id);
      logger.info(`---STRUCTURE_LEVEL.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Niveau de structure ${id}`,
        data: level,
      });
    } catch (error) {
      logger.error(`---STRUCTURE_LEVEL.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStructureLevelDto: UpdateStructureLevelDto,
    @Res() res,
  ) {
    try {
      logger.info(`---STRUCTURE_LEVEL.CONTROLLER.UPDATE INIT---`);
      const updated = await this.structureLevelService.update(
        id,
        updateStructureLevelDto,
      );
      logger.info(`---STRUCTURE_LEVEL.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Niveau de structure ${id} mis à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---STRUCTURE_LEVEL.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---STRUCTURE_LEVEL.CONTROLLER.REMOVE INIT---`);
      const deleted = await this.structureLevelService.remove(id);
      logger.info(`---STRUCTURE_LEVEL.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Niveau de structure ${id} supprimé`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---STRUCTURE_LEVEL.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
