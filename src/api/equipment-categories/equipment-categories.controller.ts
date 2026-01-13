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
import { EquipmentCategoriesService } from './equipment-categories.service';
import { CreateEquipmentCategoryDto } from './dto/create-equipment-category.dto';
import { UpdateEquipmentCategoryDto } from './dto/update-equipment-category.dto';
import { FindEquipmentCategoryDto } from './dto/find-equipment-category.dto';
import logger from 'src/utils/logger';

@Controller('equipment-categories')
export class EquipmentCategoriesController {
  constructor(private readonly equipmentCategoriesService: EquipmentCategoriesService) {}

  @Post()
  async create(
    @Body() createEquipmentCategoryDto: CreateEquipmentCategoryDto,
    @Res() res,
  ) {
    try {
      logger.info(`---EQUIPMENT_CATEGORIES.CONTROLLER.CREATE INIT---`);
      const equipmentCategory = await this.equipmentCategoriesService.create(
        createEquipmentCategoryDto,
      );
      logger.info(`---EQUIPMENT_CATEGORIES.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: "Catégorie d'équipement créé avec succès",
        data: equipmentCategory,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_CATEGORIES.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindEquipmentCategoryDto, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_CATEGORIES.CONTROLLER.FIND_ALL INIT---`);
      const result = await this.equipmentCategoriesService.findAll(query);
      logger.info(`---EQUIPMENT_CATEGORIES.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: "Liste des catégories d'équipements",
        ...result,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_CATEGORIES.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_CATEGORIES.CONTROLLER.FIND_ONE INIT---`);
      const equipmentCategory = await this.equipmentCategoriesService.findOne(id);
      logger.info(`---EQUIPMENT_CATEGORIES.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Catégorie d'équipement ${id}`,
        data: equipmentCategory,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_CATEGORIES.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEquipmentCategoryDto: UpdateEquipmentCategoryDto,
    @Res() res,
  ) {
    try {
      logger.info(`---EQUIPMENT_CATEGORIES.CONTROLLER.UPDATE INIT---`);
      const updated = await this.equipmentCategoriesService.update(
        id,
        updateEquipmentCategoryDto,
      );
      logger.info(`---EQUIPMENT_CATEGORIES.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Catégorie d'équipement ${id} mise à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_CATEGORIES.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---EQUIPMENT_CATEGORIES.CONTROLLER.REMOVE INIT---`);
      const deleted = await this.equipmentCategoriesService.remove(id);
      logger.info(`---EQUIPMENT_CATEGORIES.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Catégorie d'équipement ${id} supprimée`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---EQUIPMENT_CATEGORIES.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
