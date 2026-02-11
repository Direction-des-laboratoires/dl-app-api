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
import { EquipmentTypesService } from './equipment-types.service';
import { CreateEquipmentTypeDto } from './dto/create-equipment-type.dto';
import { UpdateEquipmentTypeDto } from './dto/update-equipment-type.dto';
import { FindEquipmentTypeDto } from './dto/find-equipment-type.dto';
import logger from 'src/utils/logger';

@Controller('equipment-types')
export class EquipmentTypesController {
  constructor(private readonly equipmentTypesService: EquipmentTypesService) {}

  @Post()
  async create(
    @Body() createEquipmentTypeDto: CreateEquipmentTypeDto,
    @Res() res,
  ) {
    try {
      logger.info(`---EQUIPMENT_TYPES.CONTROLLER.CREATE INIT---`);
      const equipmentType = await this.equipmentTypesService.create(createEquipmentTypeDto);
      logger.info(`---EQUIPMENT_TYPES.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: "Type d'équipement créé avec succès",
        data: equipmentType,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_TYPES.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Post('bulk')
  async createBulk(
    @Body() equipmentTypesDto: CreateEquipmentTypeDto[],
    @Res() res,
  ) {
    try {
      logger.info(`---EQUIPMENT_TYPES.CONTROLLER.CREATE_BULK INIT---`);
      const result = await this.equipmentTypesService.createBulk(equipmentTypesDto);
      logger.info(`---EQUIPMENT_TYPES.CONTROLLER.CREATE_BULK SUCCESS---`);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      logger.error(`---EQUIPMENT_TYPES.CONTROLLER.CREATE_BULK ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindEquipmentTypeDto, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_TYPES.CONTROLLER.FIND_ALL INIT---`);
      const result = await this.equipmentTypesService.findAll(query);
      logger.info(`---EQUIPMENT_TYPES.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: "Liste des types d'équipements",
        ...result,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_TYPES.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_TYPES.CONTROLLER.FIND_ONE INIT--- id=${id}`);
      const equipmentType = await this.equipmentTypesService.findOne(id);
      logger.info(`---EQUIPMENT_TYPES.CONTROLLER.FIND_ONE SUCCESS--- id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: `Type d'équipement ${id}`,
        data: equipmentType,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_TYPES.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEquipmentTypeDto: UpdateEquipmentTypeDto,
    @Res() res,
  ) {
    try {
      logger.info(`---EQUIPMENT_TYPES.CONTROLLER.UPDATE INIT--- id=${id}`);
      const updated = await this.equipmentTypesService.update(id, updateEquipmentTypeDto);
      logger.info(`---EQUIPMENT_TYPES.CONTROLLER.UPDATE SUCCESS--- id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: `Type d'équipement ${id} mis à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_TYPES.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_TYPES.CONTROLLER.REMOVE INIT--- id=${id}`);
      const deleted = await this.equipmentTypesService.remove(id);
      logger.info(`---EQUIPMENT_TYPES.CONTROLLER.REMOVE SUCCESS--- id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: `Type d'équipement ${id} supprimé`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_TYPES.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
