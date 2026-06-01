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
  Req,
} from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { CreateBulkResponseDto } from './dto/create-bulk-response.dto';
import { UpdateResponseDto } from './dto/update-response.dto';
import { FindResponseDto } from './dto/find-response.dto';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';

@Controller('responses')
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Post('bulk')
  async createBulk(
    @Body() createBulkDto: CreateBulkResponseDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---RESPONSES.CONTROLLER.CREATE_BULK INIT---`);
      const data = await this.responsesService.createBulk(
        createBulkDto,
        req.user,
      );
      logger.info(`---RESPONSES.CONTROLLER.CREATE_BULK SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: `${data.length} réponse(s) créée(s) avec succès`,
        data,
      });
    } catch (error) {
      logger.error(`---RESPONSES.CONTROLLER.CREATE_BULK ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Post()
  async create(
    @Body() createResponseDto: CreateResponseDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---RESPONSES.CONTROLLER.CREATE INIT---`);
      const response = await this.responsesService.create(
        createResponseDto,
        req.user,
      );
      logger.info(`---RESPONSES.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Réponse créée avec succès',
        data: response,
      });
    } catch (error) {
      logger.error(`---RESPONSES.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindResponseDto, @Res() res) {
    try {
      logger.info(`---RESPONSES.CONTROLLER.FIND_ALL INIT---`);
      const result = await this.responsesService.findAll(query);
      logger.info(`---RESPONSES.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des réponses',
        ...result,
      });
    } catch (error) {
      logger.error(`---RESPONSES.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---RESPONSES.CONTROLLER.FIND_ONE INIT---`);
      const response = await this.responsesService.findOne(id);
      logger.info(`---RESPONSES.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Réponse ${id}`,
        data: response,
      });
    } catch (error) {
      logger.error(`---RESPONSES.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateResponseDto: UpdateResponseDto,
    @Res() res,
  ) {
    try {
      logger.info(`---RESPONSES.CONTROLLER.UPDATE INIT---`);
      const updated = await this.responsesService.update(id, updateResponseDto);
      logger.info(`---RESPONSES.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Réponse ${id} mise à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---RESPONSES.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---RESPONSES.CONTROLLER.REMOVE INIT---`);
      const deleted = await this.responsesService.remove(id);
      logger.info(`---RESPONSES.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Réponse ${id} supprimée`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---RESPONSES.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
