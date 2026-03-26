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
import { StructureLevelEquipmentTypeService } from './structure-level-equipment-type.service';
import { CreateStructureLevelEquipmentTypeDto } from './dto/create-structure-level-equipment-type.dto';
import { UpdateStructureLevelEquipmentTypeDto } from './dto/update-structure-level-equipment-type.dto';
import logger from 'src/utils/logger';

@Controller('structure-level-equipment-types')
export class StructureLevelEquipmentTypeController {
  constructor(
    private readonly structureLevelEquipmentTypeService: StructureLevelEquipmentTypeService,
  ) {}

  @Post()
  async create(
    @Body() createDto: CreateStructureLevelEquipmentTypeDto,
    @Res() res,
  ) {
    try {
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.CREATE INIT---`);
      const created =
        await this.structureLevelEquipmentTypeService.create(createDto);
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Association structureLevel-equipmentType créée',
        data: created,
      });
    } catch (error) {
      logger.error(
        `---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.CREATE ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(
    @Res() res,
    @Query('structureLevel') structureLevel?: string,
    @Query('equipmentType') equipmentType?: string,
    @Query('levelCode') levelCode?: string,
    @Query('search') search?: string,
  ) {
    try {
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.FIND_ALL INIT---`);
      const list = await this.structureLevelEquipmentTypeService.findAll({
        structureLevel,
        equipmentType,
        levelCode,
        search,
      });
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des associations structureLevel-equipmentType',
        data: list,
      });
    } catch (error) {
      logger.error(
        `---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.FIND_ALL ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.FIND_ONE INIT---`);
      const item =
        await this.structureLevelEquipmentTypeService.findOne(id);
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Association structureLevel-equipmentType',
        data: item,
      });
    } catch (error) {
      logger.error(
        `---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.FIND_ONE ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateStructureLevelEquipmentTypeDto,
    @Res() res,
  ) {
    try {
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.UPDATE INIT---`);
      const updated =
        await this.structureLevelEquipmentTypeService.update(id, updateDto);
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Association mise à jour',
        data: updated,
      });
    } catch (error) {
      logger.error(
        `---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.UPDATE ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.REMOVE INIT---`);
      await this.structureLevelEquipmentTypeService.remove(id);
      logger.info(`---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Association supprimée',
      });
    } catch (error) {
      logger.error(
        `---STRUCTURE_LEVEL_EQUIPMENT_TYPE.CONTROLLER.REMOVE ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
