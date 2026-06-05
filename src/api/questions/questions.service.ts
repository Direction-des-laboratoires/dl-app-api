import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question } from './interfaces/question.interface';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { FindQuestionDto } from './dto/find-question.dto';
import { validateQuestionConfig } from './utils/validate-question-config';
import logger from 'src/utils/logger';

@Injectable()
export class QuestionsService {
  constructor(@InjectModel('Question') private questionModel: Model<Question>) {}

  async create(createQuestionDto: CreateQuestionDto) {
    try {
      logger.info(`---QUESTIONS.SERVICE.CREATE INIT---`);
      validateQuestionConfig(createQuestionDto);
      const question = await this.questionModel.create(createQuestionDto);
      logger.info(`---QUESTIONS.SERVICE.CREATE SUCCESS---`);
      return question;
    } catch (error) {
      logger.error(`---QUESTIONS.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindQuestionDto) {
    try {
      logger.info(`---QUESTIONS.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, category, responseValueType, search } = query;
      const skip = (page - 1) * limit;

      const filters: Record<string, unknown> = {};
      if (category) filters.category = category;
      if (responseValueType) filters.responseValueType = responseValueType;
      if (search) {
        filters.$or = [
          { label: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.questionModel
          .find(filters)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.questionModel.countDocuments(filters).exec(),
      ]);

      logger.info(`---QUESTIONS.SERVICE.FIND_ALL SUCCESS---`);
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
      logger.error(`---QUESTIONS.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---QUESTIONS.SERVICE.FIND_ONE INIT---`);
      const question = await this.questionModel.findById(id).exec();
      if (!question) {
        throw new HttpException('Question non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---QUESTIONS.SERVICE.FIND_ONE SUCCESS---`);
      return question;
    } catch (error) {
      logger.error(`---QUESTIONS.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto) {
    try {
      logger.info(`---QUESTIONS.SERVICE.UPDATE INIT---`);
      const existing = await this.questionModel.findById(id).exec();
      if (!existing) {
        throw new HttpException('Question non trouvée', HttpStatus.NOT_FOUND);
      }

      validateQuestionConfig({
        responseValueType:
          updateQuestionDto.responseValueType ?? existing.responseValueType,
        options: updateQuestionDto.options ?? existing.options,
        responsePrecisionCondition:
          updateQuestionDto.responsePrecisionCondition ??
          existing.responsePrecisionCondition,
      });

      const updated = await this.questionModel
        .findByIdAndUpdate(
          id,
          { ...updateQuestionDto, updated_at: new Date() },
          { new: true },
        )
        .exec();
      if (!updated) {
        throw new HttpException('Question non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---QUESTIONS.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(`---QUESTIONS.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---QUESTIONS.SERVICE.REMOVE INIT---`);
      const deleted = await this.questionModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        throw new HttpException('Question non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---QUESTIONS.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(`---QUESTIONS.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
