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
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { FindQuestionDto } from './dto/find-question.dto';
import logger from 'src/utils/logger';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Roles(Role.SuperAdmin)
  @Post()
  async create(@Body() createQuestionDto: CreateQuestionDto, @Res() res) {
    try {
      logger.info(`---QUESTIONS.CONTROLLER.CREATE INIT---`);
      const question = await this.questionsService.create(createQuestionDto);
      logger.info(`---QUESTIONS.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Question créée avec succès',
        data: question,
      });
    } catch (error) {
      logger.error(`---QUESTIONS.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindQuestionDto, @Res() res) {
    try {
      logger.info(`---QUESTIONS.CONTROLLER.FIND_ALL INIT---`);
      const result = await this.questionsService.findAll(query);
      logger.info(`---QUESTIONS.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des questions',
        ...result,
      });
    } catch (error) {
      logger.error(`---QUESTIONS.CONTROLLER.FIND_ALL ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---QUESTIONS.CONTROLLER.FIND_ONE INIT---`);
      const question = await this.questionsService.findOne(id);
      logger.info(`---QUESTIONS.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Question ${id}`,
        data: question,
      });
    } catch (error) {
      logger.error(`---QUESTIONS.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Res() res,
  ) {
    try {
      logger.info(`---QUESTIONS.CONTROLLER.UPDATE INIT---`);
      const updated = await this.questionsService.update(id, updateQuestionDto);
      logger.info(`---QUESTIONS.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Question ${id} mise à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---QUESTIONS.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---QUESTIONS.CONTROLLER.REMOVE INIT---`);
      const deleted = await this.questionsService.remove(id);
      logger.info(`---QUESTIONS.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Question ${id} supprimée`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---QUESTIONS.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
