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
import { DistrictService } from './district.service';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';
import logger from 'src/utils/logger';

@Controller('districts')
export class DistrictController {
  constructor(private readonly districtService: DistrictService) {}

  @Post()
  async create(@Body() createDistrictDto: CreateDistrictDto, @Res() res) {
    try {
      logger.info(`---DISTRICT.CONTROLLER.CREATE INIT---`);
      const district = await this.districtService.create(createDistrictDto);
      logger.info(`---DISTRICT.CONTROLLER.CREATE SUCCESS---`);
      return res
        .status(HttpStatus.CREATED)
        .json({ message: 'District créé', data: district });
    } catch (error) {
      logger.error(`---DISTRICT.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Post('bulk')
  async createBulk(@Body() districtsDto: CreateDistrictDto[], @Res() res) {
    try {
      logger.info(`---DISTRICT.CONTROLLER.CREATE_BULK INIT---`);
      const result = await this.districtService.createBulk(districtsDto);
      logger.info(`---DISTRICT.CONTROLLER.CREATE_BULK SUCCESS---`);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      logger.error(`---DISTRICT.CONTROLLER.CREATE_BULK ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Post('seeds')
  async createMany(@Res() res) {
    try {
      logger.info(`---DISTRICT.CONTROLLER.CREATE_MANY INIT---`);
      const districts = await this.districtService.createMany();
      logger.info(`---DISTRICT.CONTROLLER.CREATE_MANY SUCCESS---`);
      return res
        .status(HttpStatus.CREATED)
        .json({ message: 'Districts créés', data: districts });
    } catch (error) {
      logger.error(`---DISTRICT.CONTROLLER.CREATE_MANY ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(
    @Query()
    query: {
      page?: number;
      limit?: number;
      name?: string;
      region?: string;
      search?: string;
    },
    @Res() res,
  ) {
    try {
      logger.info(`---DISTRICT.CONTROLLER.FIND_ALL INIT---`);
      const result = await this.districtService.findAll(query);
      logger.info(`---DISTRICT.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des districts',
        ...result,
      });
    } catch (error) {
      logger.error(`---DISTRICT.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---DISTRICT.CONTROLLER.FIND_ONE INIT---`);
      const district = await this.districtService.findOne(id);
      logger.info(`---DISTRICT.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `District ${id}`,
        data: district,
      });
    } catch (error) {
      logger.error(`---DISTRICT.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDistrictDto: UpdateDistrictDto,
    @Res() res,
  ) {
    try {
      logger.info(`---DISTRICT.CONTROLLER.UPDATE INIT---`);
      const updated = await this.districtService.update(id, updateDistrictDto);
      logger.info(`---DISTRICT.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `District ${id} mis à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---DISTRICT.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---DISTRICT.CONTROLLER.REMOVE INIT---`);
      const deleted = await this.districtService.remove(id);
      logger.info(`---DISTRICT.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `District ${id} supprimé`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---DISTRICT.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
