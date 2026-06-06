import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuestionSection } from './interfaces/question-section.interface';
import { Question } from '../questions/interfaces/question.interface';
import { CreateQuestionSectionDto } from './dto/create-question-section.dto';
import { UpdateQuestionSectionDto } from './dto/update-question-section.dto';
import { FindQuestionSectionDto } from './dto/find-question-section.dto';
import logger from 'src/utils/logger';

@Injectable()
export class QuestionSectionsService {
  constructor(
    @InjectModel('QuestionSection')
    private questionSectionModel: Model<QuestionSection>,
    @InjectModel('Question') private questionModel: Model<Question>,
  ) {}

  async create(createQuestionSectionDto: CreateQuestionSectionDto) {
    try {
      logger.info(`---QUESTION_SECTIONS.SERVICE.CREATE INIT---`);
      const section = await this.questionSectionModel.create(
        createQuestionSectionDto,
      );
      logger.info(`---QUESTION_SECTIONS.SERVICE.CREATE SUCCESS---`);
      return section;
    } catch (error) {
      logger.error(`---QUESTION_SECTIONS.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindQuestionSectionDto) {
    try {
      logger.info(`---QUESTION_SECTIONS.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, category, search } = query;
      const skip = (page - 1) * limit;

      const filters: Record<string, unknown> = {};
      if (category) filters.category = category;
      if (search) {
        filters.$or = [{ name: { $regex: search, $options: 'i' } }];
      }

      const [data, total] = await Promise.all([
        this.questionSectionModel
          .find(filters)
          .sort({ category: 1, name: 1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.questionSectionModel.countDocuments(filters).exec(),
      ]);

      logger.info(`---QUESTION_SECTIONS.SERVICE.FIND_ALL SUCCESS---`);
      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`---QUESTION_SECTIONS.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---QUESTION_SECTIONS.SERVICE.FIND_ONE INIT---`);
      const section = await this.questionSectionModel.findById(id).exec();
      if (!section) {
        throw new HttpException('Section non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---QUESTION_SECTIONS.SERVICE.FIND_ONE SUCCESS---`);
      return section;
    } catch (error) {
      logger.error(`---QUESTION_SECTIONS.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateQuestionSectionDto: UpdateQuestionSectionDto) {
    try {
      logger.info(`---QUESTION_SECTIONS.SERVICE.UPDATE INIT---`);
      const existing = await this.questionSectionModel.findById(id).exec();
      if (!existing) {
        throw new HttpException('Section non trouvée', HttpStatus.NOT_FOUND);
      }

      if (
        updateQuestionSectionDto.category &&
        updateQuestionSectionDto.category !== existing.category
      ) {
        const linkedCount = await this.questionModel
          .countDocuments({ section: id })
          .exec();
        if (linkedCount > 0) {
          throw new HttpException(
            'Impossible de modifier la catégorie : des questions sont liées à cette section',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const updated = await this.questionSectionModel
        .findByIdAndUpdate(
          id,
          { ...updateQuestionSectionDto, updated_at: new Date() },
          { new: true },
        )
        .exec();
      logger.info(`---QUESTION_SECTIONS.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(`---QUESTION_SECTIONS.SERVICE.UPDATE ERROR ${error}---`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---QUESTION_SECTIONS.SERVICE.REMOVE INIT---`);
      const linkedCount = await this.questionModel
        .countDocuments({ section: id })
        .exec();
      if (linkedCount > 0) {
        throw new HttpException(
          'Impossible de supprimer une section contenant des questions',
          HttpStatus.BAD_REQUEST,
        );
      }

      const deleted = await this.questionSectionModel
        .findByIdAndDelete(id)
        .exec();
      if (!deleted) {
        throw new HttpException('Section non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---QUESTION_SECTIONS.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(`---QUESTION_SECTIONS.SERVICE.REMOVE ERROR ${error}---`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
