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
} from '@nestjs/common';
import { SubSpecialityService } from './sub-speciality.service';
import { CreateSubSpecialityDto } from './dto/create-sub-speciality.dto';
import { UpdateSubSpecialityDto } from './dto/update-sub-speciality.dto';
import { FindSubSpecialityDto } from './dto/find-sub-speciality.dto';
import logger from 'src/utils/logger';

@Controller('sub-specialities')
export class SubSpecialityController {
  constructor(private readonly subSpecialityService: SubSpecialityService) {}

  @Post()
  async create(@Body() createSubSpecialityDto: CreateSubSpecialityDto, @Res() res) {
    try {
      logger.info(`---SUB_SPECIALITY.CONTROLLER.CREATE INIT---`);
      const subSpeciality = await this.subSpecialityService.create(
        createSubSpecialityDto,
      );
      logger.info(`---SUB_SPECIALITY.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Sous-spécialité créée avec succès',
        data: subSpeciality,
      });
    } catch (error) {
      logger.error(`---SUB_SPECIALITY.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindSubSpecialityDto, @Res() res) {
    try {
      logger.info(`---SUB_SPECIALITY.CONTROLLER.FIND_ALL INIT---`);
      const result = await this.subSpecialityService.findAll(query);
      logger.info(`---SUB_SPECIALITY.CONTROLLER.FIND_ALL SUCCESS---`);
      const response: any = {
        message: 'Liste des sous-spécialités',
        data: result.data,
      };
      if (result.total !== undefined) {
        response.pagination = {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        };
      }
      return res.status(HttpStatus.OK).json(response);
    } catch (error) {
      logger.error(`---SUB_SPECIALITY.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response || { message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---SUB_SPECIALITY.CONTROLLER.FIND_ONE INIT---`);
      const subSpeciality = await this.subSpecialityService.findOne(id);
      logger.info(`---SUB_SPECIALITY.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Sous-spécialité ${id}`,
        data: subSpeciality,
      });
    } catch (error) {
      logger.error(`---SUB_SPECIALITY.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSubSpecialityDto: UpdateSubSpecialityDto,
    @Res() res,
  ) {
    try {
      logger.info(`---SUB_SPECIALITY.CONTROLLER.UPDATE INIT---`);
      const updated = await this.subSpecialityService.update(
        id,
        updateSubSpecialityDto,
      );
      logger.info(`---SUB_SPECIALITY.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Sous-spécialité ${id} mise à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---SUB_SPECIALITY.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---SUB_SPECIALITY.CONTROLLER.REMOVE INIT---`);
      const deleted = await this.subSpecialityService.remove(id);
      logger.info(`---SUB_SPECIALITY.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Sous-spécialité ${id} supprimée`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---SUB_SPECIALITY.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
