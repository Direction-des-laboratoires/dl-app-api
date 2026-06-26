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
import { SpecialityService } from './speciality.service';
import { CreateSpecialityDto } from './dto/create-speciality.dto';
import { UpdateSpecialityDto } from './dto/update-speciality.dto';
import { FindSpecialityDto } from './dto/find-speciality.dto';
import logger from 'src/utils/logger';

@Controller('specialities')
export class SpecialityController {
  constructor(private readonly specialityService: SpecialityService) {}

  @Post()
  async create(@Body() createSpecialityDto: CreateSpecialityDto, @Res() res) {
    try {
      logger.info(`---SPECIALITY.CONTROLLER.CREATE INIT---`);
      const speciality = await this.specialityService.create(
        createSpecialityDto,
      );
      logger.info(`---SPECIALITY.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Spécialité créée avec succès',
        data: speciality,
      });
    } catch (error) {
      logger.error(`---SPECIALITY.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindSpecialityDto, @Res() res) {
    try {
      logger.info(`---SPECIALITY.CONTROLLER.FIND_ALL INIT---`);
      const result = await this.specialityService.findAll(query);
      logger.info(`---SPECIALITY.CONTROLLER.FIND_ALL SUCCESS---`);
      const response: any = {
        message: 'Liste des spécialités',
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
      logger.error(`---SPECIALITY.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response || { message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---SPECIALITY.CONTROLLER.FIND_ONE INIT---`);
      const speciality = await this.specialityService.findOne(id);
      logger.info(`---SPECIALITY.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Spécialité ${id}`,
        data: speciality,
      });
    } catch (error) {
      logger.error(`---SPECIALITY.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSpecialityDto: UpdateSpecialityDto,
    @Res() res,
  ) {
    try {
      logger.info(`---SPECIALITY.CONTROLLER.UPDATE INIT---`);
      const updated = await this.specialityService.update(
        id,
        updateSpecialityDto,
      );
      logger.info(`---SPECIALITY.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Spécialité ${id} mise à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---SPECIALITY.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---SPECIALITY.CONTROLLER.REMOVE INIT---`);
      const deleted = await this.specialityService.remove(id);
      logger.info(`---SPECIALITY.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Spécialité ${id} supprimée`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---SPECIALITY.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
