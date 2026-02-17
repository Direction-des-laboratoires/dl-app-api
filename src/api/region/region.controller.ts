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
import { RegionService } from './region.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import logger from 'src/utils/logger';

@Controller('regions')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Post()
  async create(@Body() createRegionDto: CreateRegionDto, @Res() res) {
    try {
      logger.info(`---REGION.CONTROLLER.CREATE INIT---`);
      const region = await this.regionService.create(createRegionDto);
      logger.info(`---REGION.CONTROLLER.CREATE SUCCESS---`);
      return res
        .status(HttpStatus.CREATED)
        .json({ message: 'Region créée', data: region });
    } catch (error) {
      logger.error(`---REGION.CONTROLLER.CREATE ERROR ${error}---`);
      return res.status(error.status).json({ message: error.message });
    }
  }

  @Post('seeds')
  async createMany(@Res() res) {
    try {
      logger.info(`---REGION.CONTROLLER.CREATE_MANY INIT---`);
      const regions = await this.regionService.createMany();
      logger.info(`---REGION.CONTROLLER.CREATE_MANY SUCCESS---`);
      return res
        .status(HttpStatus.CREATED)
        .json({ message: 'Regions créée', data: regions });
    } catch (error) {
      logger.error(`---REGION.CONTROLLER.CREATE_MANY ERROR ${error}---`);
      return res.status(error.status).json({ message: error.message });
    }
  }

  @Get()
  async findAll(
    @Query()
    query: {
      page?: number;
      limit?: number;
      name?: string;
      code?: string;
      search?: string;
      pole?: string;
      poleId?: string;
    },
    @Res() res,
  ) {
    try {
      logger.info(`---REGION.CONTROLLER.FIND_ALL INIT---`);
      const result = await this.regionService.findAll(query);
      logger.info(`---REGION.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des régions',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      logger.error(`---REGION.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---REGION.CONTROLLER.FIND_ONE INIT---`);
      const region = await this.regionService.findOne(id);
      logger.info(`---REGION.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Région ${id}`,
        data: region,
      });
    } catch (error) {
      logger.error(`---REGION.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRegionDto: UpdateRegionDto,
    @Res() res,
  ) {
    try {
      logger.info(`---REGION.CONTROLLER.UPDATE INIT---`);
      const updated = await this.regionService.update(id, updateRegionDto);
      logger.info(`---REGION.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Région ${id} mise à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---REGION.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---REGION.CONTROLLER.REMOVE INIT---`);
      const deleted = await this.regionService.remove(id);
      logger.info(`---REGION.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Région ${id} supprimée`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---REGION.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
