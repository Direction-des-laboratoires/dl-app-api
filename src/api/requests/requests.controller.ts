import { Controller, Get, Query, Param, Res, HttpStatus, Req } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { FindRequestsDto } from './dto/find-requests.dto';
import { StatisticsFilterDto } from 'src/utils/dto/statistics-filter.dto';
import logger from 'src/utils/logger';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  async findAll(@Query() filters: FindRequestsDto, @Res() res) {
    try {
      logger.info('-----REQUESTS.CONTROLLER.FINDALL-----INIT');
      const result = await this.requestsService.findAll(filters);
      logger.info(
        `-----REQUESTS.CONTROLLER.FINDALL-----SUCCESS: ${result.pagination.total} requests found`,
      );
      return res.status(HttpStatus.OK).json({
        message: 'Liste des demandes',
        ...result,
      });
    } catch (error: any) {
      logger.error(
        `-----REQUESTS.CONTROLLER.FINDALL-----ERROR: ${error.message}`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get('statistics')
  async getStatistics(@Query() query: StatisticsFilterDto, @Req() req, @Res() res) {
    try {
      logger.info('-----REQUESTS.CONTROLLER.GETSTATISTICS-----INIT');
      const statistics = await this.requestsService.getStatistics(req.user, query);
      logger.info('-----REQUESTS.CONTROLLER.GETSTATISTICS-----SUCCESS');
      return res.status(HttpStatus.OK).json({
        message: 'Statistiques des demandes',
        data: statistics,
      });
    } catch (error: any) {
      logger.error(
        `-----REQUESTS.CONTROLLER.GETSTATISTICS-----ERROR: ${error.message}`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`-----REQUESTS.CONTROLLER.FINDONE-----INIT: id=${id}`);
      const request = await this.requestsService.findOne(id);
      logger.info(`-----REQUESTS.CONTROLLER.FINDONE-----SUCCESS: id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: `Demande ${id}`,
        data: request,
      });
    } catch (error: any) {
      logger.error(
        `-----REQUESTS.CONTROLLER.FINDONE-----ERROR: id=${id}, error=${error.message}`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
