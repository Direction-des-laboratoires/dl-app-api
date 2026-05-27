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
import { InvestigationQuestionsService } from './investigation-questions.service';
import { CreateInvestigationQuestionDto } from './dto/create-investigation-question.dto';
import { UpdateInvestigationQuestionDto } from './dto/update-investigation-question.dto';
import { FindInvestigationQuestionDto } from './dto/find-investigation-question.dto';
import logger from 'src/utils/logger';

@Controller('investigation-questions')
export class InvestigationQuestionsController {
  constructor(
    private readonly investigationQuestionsService: InvestigationQuestionsService,
  ) {}

  @Post()
  async create(
    @Body() createDto: CreateInvestigationQuestionDto,
    @Res() res,
  ) {
    try {
      logger.info(`---INVESTIGATION_QUESTIONS.CONTROLLER.CREATE INIT---`);
      const data = await this.investigationQuestionsService.create(createDto);
      logger.info(`---INVESTIGATION_QUESTIONS.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Question associée à l\'enquête avec succès',
        data,
      });
    } catch (error) {
      logger.error(`---INVESTIGATION_QUESTIONS.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindInvestigationQuestionDto, @Res() res) {
    try {
      logger.info(`---INVESTIGATION_QUESTIONS.CONTROLLER.FIND_ALL INIT---`);
      const result = await this.investigationQuestionsService.findAll(query);
      logger.info(`---INVESTIGATION_QUESTIONS.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des questions d\'enquête',
        ...result,
      });
    } catch (error) {
      logger.error(`---INVESTIGATION_QUESTIONS.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---INVESTIGATION_QUESTIONS.CONTROLLER.FIND_ONE INIT---`);
      const data = await this.investigationQuestionsService.findOne(id);
      logger.info(`---INVESTIGATION_QUESTIONS.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Association enquête-question ${id}`,
        data,
      });
    } catch (error) {
      logger.error(`---INVESTIGATION_QUESTIONS.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInvestigationQuestionDto,
    @Res() res,
  ) {
    try {
      logger.info(`---INVESTIGATION_QUESTIONS.CONTROLLER.UPDATE INIT---`);
      const data = await this.investigationQuestionsService.update(id, updateDto);
      logger.info(`---INVESTIGATION_QUESTIONS.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Association enquête-question ${id} mise à jour`,
        data,
      });
    } catch (error) {
      logger.error(`---INVESTIGATION_QUESTIONS.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---INVESTIGATION_QUESTIONS.CONTROLLER.REMOVE INIT---`);
      const data = await this.investigationQuestionsService.remove(id);
      logger.info(`---INVESTIGATION_QUESTIONS.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Association enquête-question ${id} supprimée`,
        data,
      });
    } catch (error) {
      logger.error(`---INVESTIGATION_QUESTIONS.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
