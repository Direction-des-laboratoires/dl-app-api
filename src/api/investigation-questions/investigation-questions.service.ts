import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InvestigationQuestion } from './interfaces/investigation-question.interface';
import { Investigation } from '../investigations/interfaces/investigation.interface';
import { Question } from '../questions/interfaces/question.interface';
import { CreateInvestigationQuestionDto } from './dto/create-investigation-question.dto';
import { UpdateInvestigationQuestionDto } from './dto/update-investigation-question.dto';
import { FindInvestigationQuestionDto } from './dto/find-investigation-question.dto';
import logger from 'src/utils/logger';

@Injectable()
export class InvestigationQuestionsService {
  constructor(
    @InjectModel('InvestigationQuestion')
    private investigationQuestionModel: Model<InvestigationQuestion>,
    @InjectModel('Investigation')
    private investigationModel: Model<Investigation>,
    @InjectModel('Question')
    private questionModel: Model<Question>,
  ) {}

  private async validateRefs(
    investigationId: string,
    questionId: string,
  ): Promise<void> {
    const [investigation, question] = await Promise.all([
      this.investigationModel.findById(investigationId).exec(),
      this.questionModel.findById(questionId).exec(),
    ]);
    if (!investigation) {
      throw new HttpException('Enquête non trouvée', HttpStatus.NOT_FOUND);
    }
    if (!question) {
      throw new HttpException('Question non trouvée', HttpStatus.NOT_FOUND);
    }
  }

  private handleError(error: unknown, context: string): never {
    logger.error(`---INVESTIGATION_QUESTIONS.SERVICE.${context} ERROR ${error}---`);
    if (error instanceof HttpException) {
      throw error;
    }
    const err = error as { code?: number; message?: string; status?: number };
    if (err?.code === 11000) {
      throw new HttpException(
        'Cette question est déjà associée à cette enquête',
        HttpStatus.CONFLICT,
      );
    }
    throw new HttpException(
      err.message || 'Erreur serveur',
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  async create(createDto: CreateInvestigationQuestionDto) {
    try {
      logger.info(`---INVESTIGATION_QUESTIONS.SERVICE.CREATE INIT---`);
      await this.validateRefs(createDto.investigation, createDto.question);

      const created = await this.investigationQuestionModel.create(createDto);
      await created.populate([
        { path: 'investigation', select: 'title active' },
        {
          path: 'question',
          select:
            'section category label responseValueType isRequired responsePrecisionCondition precisionLabel precisionValueType precisionOptions options',
          populate: { path: 'section', select: 'name category' },
        },
      ]);

      logger.info(`---INVESTIGATION_QUESTIONS.SERVICE.CREATE SUCCESS---`);
      return created;
    } catch (error) {
      this.handleError(error, 'CREATE');
    }
  }

  async findAll(query: FindInvestigationQuestionDto) {
    try {
      logger.info(`---INVESTIGATION_QUESTIONS.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, investigation, question } = query;
      const skip = (page - 1) * limit;

      const filters: Record<string, unknown> = {};
      if (investigation) filters.investigation = investigation;
      if (question) filters.question = question;

      const [data, total] = await Promise.all([
        this.investigationQuestionModel
          .find(filters)
          .populate('investigation', 'title active')
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

      logger.info(`---INVESTIGATION_QUESTIONS.SERVICE.FIND_ALL SUCCESS---`);
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
      this.handleError(error, 'FIND_ALL');
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---INVESTIGATION_QUESTIONS.SERVICE.FIND_ONE INIT---`);
      const item = await this.investigationQuestionModel
        .findById(id)
        .populate('investigation', 'title active description')
        .populate({
          path: 'question',
          select:
            'section category label responseValueType isRequired responsePrecisionCondition precisionLabel precisionValueType precisionOptions options',
          populate: { path: 'section', select: 'name category' },
        })
        .exec();
      if (!item) {
        throw new HttpException(
          'Association enquête-question non trouvée',
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---INVESTIGATION_QUESTIONS.SERVICE.FIND_ONE SUCCESS---`);
      return item;
    } catch (error) {
      this.handleError(error, 'FIND_ONE');
    }
  }

  async update(id: string, updateDto: UpdateInvestigationQuestionDto) {
    try {
      logger.info(`---INVESTIGATION_QUESTIONS.SERVICE.UPDATE INIT---`);
      const existing = await this.investigationQuestionModel.findById(id).exec();
      if (!existing) {
        throw new HttpException(
          'Association enquête-question non trouvée',
          HttpStatus.NOT_FOUND,
        );
      }

      const investigationId =
        updateDto.investigation?.toString() ||
        existing.investigation.toString();
      const questionId =
        updateDto.question?.toString() || existing.question.toString();

      if (updateDto.investigation || updateDto.question) {
        await this.validateRefs(investigationId, questionId);
      }

      const updated = await this.investigationQuestionModel
        .findByIdAndUpdate(
          id,
          { ...updateDto, updated_at: new Date() },
          { new: true },
        )
        .populate('investigation', 'title active')
        .populate({
          path: 'question',
          select:
            'section category label responseValueType isRequired responsePrecisionCondition precisionLabel precisionValueType precisionOptions options',
          populate: { path: 'section', select: 'name category' },
        })
        .exec();

      logger.info(`---INVESTIGATION_QUESTIONS.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      this.handleError(error, 'UPDATE');
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---INVESTIGATION_QUESTIONS.SERVICE.REMOVE INIT---`);
      const deleted = await this.investigationQuestionModel
        .findByIdAndDelete(id)
        .exec();
      if (!deleted) {
        throw new HttpException(
          'Association enquête-question non trouvée',
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---INVESTIGATION_QUESTIONS.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      this.handleError(error, 'REMOVE');
    }
  }
}
