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
import { QuestionSectionsService } from './question-sections.service';
import { CreateQuestionSectionDto } from './dto/create-question-section.dto';
import { UpdateQuestionSectionDto } from './dto/update-question-section.dto';
import { FindQuestionSectionDto } from './dto/find-question-section.dto';
import logger from 'src/utils/logger';

@Controller('question-sections')
export class QuestionSectionsController {
  constructor(
    private readonly questionSectionsService: QuestionSectionsService,
  ) {}

  @Post()
  async create(@Body() createDto: CreateQuestionSectionDto, @Res() res) {
    try {
      logger.info(`---QUESTION_SECTIONS.CONTROLLER.CREATE INIT---`);
      const section = await this.questionSectionsService.create(createDto);
      logger.info(`---QUESTION_SECTIONS.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Section créée avec succès',
        data: section,
      });
    } catch (error) {
      logger.error(`---QUESTION_SECTIONS.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindQuestionSectionDto, @Res() res) {
    try {
      logger.info(`---QUESTION_SECTIONS.CONTROLLER.FIND_ALL INIT---`);
      const result = await this.questionSectionsService.findAll(query);
      logger.info(`---QUESTION_SECTIONS.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des sections',
        ...result,
      });
    } catch (error) {
      logger.error(`---QUESTION_SECTIONS.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---QUESTION_SECTIONS.CONTROLLER.FIND_ONE INIT---`);
      const section = await this.questionSectionsService.findOne(id);
      logger.info(`---QUESTION_SECTIONS.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Section ${id}`,
        data: section,
      });
    } catch (error) {
      logger.error(`---QUESTION_SECTIONS.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateQuestionSectionDto,
    @Res() res,
  ) {
    try {
      logger.info(`---QUESTION_SECTIONS.CONTROLLER.UPDATE INIT---`);
      const updated = await this.questionSectionsService.update(id, updateDto);
      logger.info(`---QUESTION_SECTIONS.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Section ${id} mise à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---QUESTION_SECTIONS.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---QUESTION_SECTIONS.CONTROLLER.REMOVE INIT---`);
      const deleted = await this.questionSectionsService.remove(id);
      logger.info(`---QUESTION_SECTIONS.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Section ${id} supprimée`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---QUESTION_SECTIONS.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
