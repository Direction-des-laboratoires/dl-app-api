import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Investigation } from './interfaces/investigation.interface';
import { InvestigationQuestion } from '../investigation-questions/interfaces/investigation-question.interface';
import { Question } from '../questions/interfaces/question.interface';
import { CreateInvestigationDto } from './dto/create-investigation.dto';
import { UpdateInvestigationDto } from './dto/update-investigation.dto';
import { FindInvestigationDto } from './dto/find-investigation.dto';
import { FindInvestigationQuestionsDto } from './dto/find-investigation-questions.dto';
import { validateInvestigationDates } from './utils/validate-investigation-dates';
import logger from 'src/utils/logger';

@Injectable()
export class InvestigationsService {
  constructor(
    @InjectModel('Investigation')
    private investigationModel: Model<Investigation>,
    @InjectModel('InvestigationQuestion')
    private investigationQuestionModel: Model<InvestigationQuestion>,
    @InjectModel('Question') private questionModel: Model<Question>,
  ) {}

  private async rollbackInvestigationCreation(investigationId: string) {
    await this.investigationQuestionModel
      .deleteMany({ investigation: investigationId })
      .exec();
    await this.investigationModel.findByIdAndDelete(investigationId).exec();
  }

  async create(createInvestigationDto: CreateInvestigationDto) {
    const { questions = [], ...investigationData } = createInvestigationDto;
    let investigationId: string | null = null;

    try {
      logger.info(`---INVESTIGATIONS.SERVICE.CREATE INIT---`);

      validateInvestigationDates(
        investigationData.startDate,
        investigationData.endDate,
      );

      const questionIds = questions.map((item) => item.question);
      if (new Set(questionIds).size !== questionIds.length) {
        throw new HttpException(
          'La liste des questions contient des doublons',
          HttpStatus.BAD_REQUEST,
        );
      }

      const investigation = await this.investigationModel.create(
        investigationData,
      );
      investigationId = investigation._id.toString();

      if (questions.length > 0) {
        const existingCount = await this.questionModel
          .countDocuments({ _id: { $in: questionIds } })
          .exec();
        if (existingCount !== questionIds.length) {
          throw new HttpException(
            'Une ou plusieurs questions sont introuvables',
            HttpStatus.NOT_FOUND,
          );
        }

        await this.investigationQuestionModel.insertMany(
          questions.map((item, index) => ({
            investigation: investigation._id,
            question: item.question,
            order: item.order ?? index + 1,
          })),
        );
      }

      logger.info(`---INVESTIGATIONS.SERVICE.CREATE SUCCESS---`);
      return this.findOne(investigationId);
    } catch (error) {
      logger.error(`---INVESTIGATIONS.SERVICE.CREATE ERROR ${error}---`);
      if (investigationId) {
        await this.rollbackInvestigationCreation(investigationId);
      }
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { code?: number; message?: string };
      if (err?.code === 11000) {
        throw new HttpException(
          'Une ou plusieurs questions sont déjà associées à cette enquête',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        err.message || 'Erreur serveur',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindInvestigationDto) {
    try {
      logger.info(`---INVESTIGATIONS.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, active, type, status, search } = query;
      const skip = (page - 1) * limit;

      const filters: Record<string, unknown> = {};
      if (active !== undefined) filters.active = active;
      if (type) filters.type = type;
      if (status) filters.status = status;
      if (search) {
        filters.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const [data, total] = await Promise.all([
        this.investigationModel
          .find(filters)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.investigationModel.countDocuments(filters).exec(),
      ]);

      logger.info(`---INVESTIGATIONS.SERVICE.FIND_ALL SUCCESS---`);
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
      logger.error(`---INVESTIGATIONS.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findQuestions(id: string, query: FindInvestigationQuestionsDto = {}) {
    try {
      logger.info(`---INVESTIGATIONS.SERVICE.FIND_QUESTIONS INIT---`);
      const investigation = await this.investigationModel.findById(id).lean().exec();
      if (!investigation) {
        throw new HttpException('Enquête non trouvée', HttpStatus.NOT_FOUND);
      }

      const { page = 1, limit = 10 } = query;
      const skip = (page - 1) * limit;
      const filters = { investigation: id };

      const [data, total] = await Promise.all([
        this.investigationQuestionModel
          .find(filters)
          .populate({
            path: 'question',
            select:
              'section category label responseValueType isRequired responsePrecisionCondition precisionLabel precisionValueType precisionOptions options',
            populate: { path: 'section', select: 'name category' },
          })
          .sort({ order: 1, created_at: 1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.investigationQuestionModel.countDocuments(filters).exec(),
      ]);

      logger.info(`---INVESTIGATIONS.SERVICE.FIND_QUESTIONS SUCCESS---`);
      return {
        investigation: {
          _id: investigation._id,
          title: investigation.title,
          active: investigation.active,
          type: investigation.type,
          status: investigation.status,
          startDate: investigation.startDate,
          endDate: investigation.endDate,
        },
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`---INVESTIGATIONS.SERVICE.FIND_QUESTIONS ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---INVESTIGATIONS.SERVICE.FIND_ONE INIT---`);
      const investigation = await this.investigationModel.findById(id).lean().exec();
      if (!investigation) {
        throw new HttpException('Enquête non trouvée', HttpStatus.NOT_FOUND);
      }

      const questions = await this.investigationQuestionModel
        .find({ investigation: id })
        .populate({
          path: 'question',
          select:
            'section category label responseValueType isRequired responsePrecisionCondition precisionLabel precisionValueType precisionOptions options',
          populate: { path: 'section', select: 'name category' },
        })
        .sort({ order: 1, created_at: 1 })
        .lean()
        .exec();

      logger.info(`---INVESTIGATIONS.SERVICE.FIND_ONE SUCCESS---`);
      return {
        ...investigation,
        questions,
      };
    } catch (error) {
      logger.error(`---INVESTIGATIONS.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateInvestigationDto: UpdateInvestigationDto) {
    try {
      logger.info(`---INVESTIGATIONS.SERVICE.UPDATE INIT---`);
      const existing = await this.investigationModel.findById(id).exec();
      if (!existing) {
        throw new HttpException('Enquête non trouvée', HttpStatus.NOT_FOUND);
      }

      const { questions, ...investigationData } = updateInvestigationDto;

      const startDate =
        investigationData.startDate ?? existing.startDate;
      const endDate = investigationData.endDate ?? existing.endDate;
      validateInvestigationDates(startDate, endDate);

      if (Object.keys(investigationData).length > 0) {
        await this.investigationModel
          .findByIdAndUpdate(
            id,
            { ...investigationData, updated_at: new Date() },
            { new: true },
          )
          .exec();
      }

      if (questions !== undefined) {
        const questionIds = questions.map((item) => item.question);
        if (new Set(questionIds).size !== questionIds.length) {
          throw new HttpException(
            'La liste des questions contient des doublons',
            HttpStatus.BAD_REQUEST,
          );
        }

        if (questions.length > 0) {
          const existingCount = await this.questionModel
            .countDocuments({ _id: { $in: questionIds } })
            .exec();
          if (existingCount !== questionIds.length) {
            throw new HttpException(
              'Une ou plusieurs questions sont introuvables',
              HttpStatus.NOT_FOUND,
            );
          }
        }

        await this.investigationQuestionModel
          .deleteMany({ investigation: id })
          .exec();

        if (questions.length > 0) {
          await this.investigationQuestionModel.insertMany(
            questions.map((item, index) => ({
              investigation: id,
              question: item.question,
              order: item.order ?? index + 1,
            })),
          );
        }
      }

      logger.info(`---INVESTIGATIONS.SERVICE.UPDATE SUCCESS---`);
      return this.findOne(id);
    } catch (error) {
      logger.error(`---INVESTIGATIONS.SERVICE.UPDATE ERROR ${error}---`);
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { code?: number; message?: string };
      if (err?.code === 11000) {
        throw new HttpException(
          'Une ou plusieurs questions sont déjà associées à cette enquête',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        err.message || 'Erreur serveur',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---INVESTIGATIONS.SERVICE.REMOVE INIT---`);
      const deleted = await this.investigationModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        throw new HttpException('Enquête non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---INVESTIGATIONS.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(`---INVESTIGATIONS.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
