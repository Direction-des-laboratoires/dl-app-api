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
import { IntrantsService } from './intrants.service';
import { IntrantStocksService } from '../intrant-stocks/intrant-stocks.service';
import { CreateIntrantDto } from './dto/create-intrant.dto';
import { UpdateIntrantDto } from './dto/update-intrant.dto';
import { FindIntrantDto } from './dto/find-intrant.dto';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';
import { Req } from '@nestjs/common';

@Controller('intrants')
export class IntrantsController {
  constructor(
    private readonly intrantsService: IntrantsService,
    private readonly intrantStocksService: IntrantStocksService,
  ) {}

  @Roles(Role.SuperAdmin)
  @Post()
  async create(@Body() createIntrantDto: CreateIntrantDto, @Res() res) {
    try {
      logger.info(`---INTRANTS.CONTROLLER.CREATE INIT---`);
      const intrant = await this.intrantsService.create(createIntrantDto);
      return res.status(HttpStatus.CREATED).json({
        message: 'Intrant créé avec succès',
        data: intrant,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get('statistics')
  async getStatistics(@Req() req, @Res() res) {
    try {
      logger.info(`---INTRANTS.CONTROLLER.GET_STATISTICS INIT---`);
      const stats = await this.intrantStocksService.getStatistics(req.user);
      return res.status(HttpStatus.OK).json({
        message: 'Statistiques des intrants récupérées avec succès',
        data: stats,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindIntrantDto, @Res() res) {
    try {
      const result = await this.intrantsService.findAll(query);
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
      const intrant = await this.intrantsService.findOne(id);
      return res.status(HttpStatus.OK).json({
        data: intrant,
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
    @Body() updateIntrantDto: UpdateIntrantDto,
    @Res() res,
  ) {
    try {
      const intrant = await this.intrantsService.update(id, updateIntrantDto);
      return res.status(HttpStatus.OK).json({
        message: 'Intrant mis à jour avec succès',
        data: intrant,
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
      const deleted = await this.intrantsService.remove(id);
      return res.status(HttpStatus.OK).json({
        message: 'Intrant supprimé avec succès',
        data: deleted,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
