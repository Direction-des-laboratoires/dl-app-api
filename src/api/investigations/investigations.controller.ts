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
import { InvestigationsService } from './investigations.service';
import { CreateInvestigationDto } from './dto/create-investigation.dto';
import { UpdateInvestigationDto } from './dto/update-investigation.dto';
import { FindInvestigationDto } from './dto/find-investigation.dto';
import { FindInvestigationQuestionsDto } from './dto/find-investigation-questions.dto';
import logger from 'src/utils/logger';

@Controller('investigations')
export class InvestigationsController {
  constructor(private readonly investigationsService: InvestigationsService) {}

  @Post()
  async create(@Body() createInvestigationDto: CreateInvestigationDto, @Res() res) {
    try {
      logger.info(`---INVESTIGATIONS.CONTROLLER.CREATE INIT---`);
      const investigation = await this.investigationsService.create(
        createInvestigationDto,
      );
      logger.info(`---INVESTIGATIONS.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Enquête créée avec succès',
        data: investigation,
      });
    } catch (error) {
      logger.error(`---INVESTIGATIONS.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindInvestigationDto, @Res() res) {
    try {
      logger.info(`---INVESTIGATIONS.CONTROLLER.FIND_ALL INIT---`);
      const result = await this.investigationsService.findAll(query);
      logger.info(`---INVESTIGATIONS.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des enquêtes',
        ...result,
      });
    } catch (error) {
      logger.error(`---INVESTIGATIONS.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id/questions/grouped-by-section')
  async findQuestionsGroupedBySection(@Param('id') id: string, @Res() res) {
    try {
      logger.info(
        `---INVESTIGATIONS.CONTROLLER.FIND_QUESTIONS_GROUPED_BY_SECTION INIT---`,
      );
      const result =
        await this.investigationsService.findQuestionsGroupedBySection(id);
      logger.info(
        `---INVESTIGATIONS.CONTROLLER.FIND_QUESTIONS_GROUPED_BY_SECTION SUCCESS---`,
      );
      return res.status(HttpStatus.OK).json({
        message: `Questions de l'enquête ${id} regroupées par section`,
        ...result,
      });
    } catch (error) {
      logger.error(
        `---INVESTIGATIONS.CONTROLLER.FIND_QUESTIONS_GROUPED_BY_SECTION ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id/questions')
  async findQuestions(
    @Param('id') id: string,
    @Query() query: FindInvestigationQuestionsDto,
    @Res() res,
  ) {
    try {
      logger.info(`---INVESTIGATIONS.CONTROLLER.FIND_QUESTIONS INIT---`);
      const result = await this.investigationsService.findQuestions(id, query);
      logger.info(`---INVESTIGATIONS.CONTROLLER.FIND_QUESTIONS SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Liste des questions de l'enquête ${id}`,
        ...result,
      });
    } catch (error) {
      logger.error(`---INVESTIGATIONS.CONTROLLER.FIND_QUESTIONS ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---INVESTIGATIONS.CONTROLLER.FIND_ONE INIT---`);
      const investigation = await this.investigationsService.findOne(id);
      logger.info(`---INVESTIGATIONS.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Enquête ${id}`,
        data: investigation,
      });
    } catch (error) {
      logger.error(`---INVESTIGATIONS.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateInvestigationDto: UpdateInvestigationDto,
    @Res() res,
  ) {
    try {
      logger.info(`---INVESTIGATIONS.CONTROLLER.UPDATE INIT---`);
      const updated = await this.investigationsService.update(
        id,
        updateInvestigationDto,
      );
      logger.info(`---INVESTIGATIONS.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Enquête ${id} mise à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---INVESTIGATIONS.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---INVESTIGATIONS.CONTROLLER.REMOVE INIT---`);
      const deleted = await this.investigationsService.remove(id);
      logger.info(`---INVESTIGATIONS.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Enquête ${id} supprimée`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---INVESTIGATIONS.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
