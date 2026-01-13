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
import { IntrantCategoriesService } from './intrant-categories.service';
import { CreateIntrantCategoryDto } from './dto/create-intrant-category.dto';
import { UpdateIntrantCategoryDto } from './dto/update-intrant-category.dto';
import { FindIntrantCategoryDto } from './dto/find-intrant-category.dto';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';

@Controller('intrant-categories')
export class IntrantCategoriesController {
  constructor(
    private readonly intrantCategoriesService: IntrantCategoriesService,
  ) {}

  @Roles(Role.SuperAdmin)
  @Post()
  async create(
    @Body() createIntrantCategoryDto: CreateIntrantCategoryDto,
    @Res() res,
  ) {
    try {
      logger.info(`---INTRANT_CATEGORIES.CONTROLLER.CREATE INIT---`);
      const category = await this.intrantCategoriesService.create(
        createIntrantCategoryDto,
      );
      return res.status(HttpStatus.CREATED).json({
        message: 'Catégorie créée avec succès',
        data: category,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindIntrantCategoryDto, @Res() res) {
    try {
      const result = await this.intrantCategoriesService.findAll(query);
      return res.status(HttpStatus.OK).json({
        ...result,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      const category = await this.intrantCategoriesService.findOne(id);
      return res.status(HttpStatus.OK).json({
        data: category,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateIntrantCategoryDto: UpdateIntrantCategoryDto,
    @Res() res,
  ) {
    try {
      const category = await this.intrantCategoriesService.update(
        id,
        updateIntrantCategoryDto,
      );
      return res.status(HttpStatus.OK).json({
        message: 'Catégorie mise à jour avec succès',
        data: category,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      const deleted = await this.intrantCategoriesService.remove(id);
      return res.status(HttpStatus.OK).json({
        message: 'Catégorie supprimée avec succès',
        data: deleted,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
