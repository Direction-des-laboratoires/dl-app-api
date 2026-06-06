import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question } from './interfaces/question.interface';
import { QuestionSection } from '../question-sections/interfaces/question-section.interface';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { FindQuestionDto } from './dto/find-question.dto';
import { FindGroupedQuestionsDto } from './dto/find-grouped-questions.dto';
import { validateQuestionConfig } from './utils/validate-question-config';
import logger from 'src/utils/logger';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel('Question') private questionModel: Model<Question>,
    @InjectModel('QuestionSection')
    private questionSectionModel: Model<QuestionSection>,
  ) {}

  private readonly questionPopulate = [
    { path: 'section', select: 'name category order' },
  ];

  private async validateSection(
    sectionId: string,
    category: string,
  ): Promise<void> {
    const section = await this.questionSectionModel.findById(sectionId).exec();
    if (!section) {
      throw new HttpException('Section non trouvée', HttpStatus.NOT_FOUND);
    }
    if (section.category !== category) {
      throw new HttpException(
        'La catégorie de la question doit correspondre à celle de la section',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async create(createQuestionDto: CreateQuestionDto) {
    try {
      logger.info(`---QUESTIONS.SERVICE.CREATE INIT---`);
      validateQuestionConfig(createQuestionDto);
      await this.validateSection(
        createQuestionDto.section,
        createQuestionDto.category,
      );
      const question = await this.questionModel.create(createQuestionDto);
      await question.populate(this.questionPopulate);
      logger.info(`---QUESTIONS.SERVICE.CREATE SUCCESS---`);
      return question;
    } catch (error) {
      logger.error(`---QUESTIONS.SERVICE.CREATE ERROR ${error}---`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindQuestionDto) {
    try {
      logger.info(`---QUESTIONS.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, section, category, responseValueType, search } =
        query;
      const skip = (page - 1) * limit;

      const filters: Record<string, unknown> = {};
      if (section) filters.section = section;
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
          .populate('section', 'name category order')
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

  async findGroupedBySection(query: FindGroupedQuestionsDto) {
    try {
      logger.info(`---QUESTIONS.SERVICE.FIND_GROUPED_BY_SECTION INIT---`);
      const { category } = query;

      const sectionFilters: Record<string, unknown> = {};
      if (category) sectionFilters.category = category;

      const sections = await this.questionSectionModel
        .aggregate([
          { $match: sectionFilters },
          {
            $addFields: {
              orderNullOrder: {
                $cond: [{ $eq: [{ $ifNull: ['$order', null] }, null] }, 1, 0],
              },
            },
          },
          { $sort: { orderNullOrder: 1, order: 1, name: 1 } },
          {
            $lookup: {
              from: this.questionModel.collection.name,
              let: { sectionId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$section', '$$sectionId'] },
                    ...(category ? { category } : {}),
                  },
                },
                { $sort: { created_at: 1 } },
              ],
              as: 'questions',
            },
          },
          { $project: { orderNullOrder: 0 } },
        ])
        .exec();

      logger.info(`---QUESTIONS.SERVICE.FIND_GROUPED_BY_SECTION SUCCESS---`);
      return {
        data: sections,
        totalSections: sections.length,
        totalQuestions: sections.reduce(
          (sum, section) => sum + section.questions.length,
          0,
        ),
      };
    } catch (error) {
      logger.error(
        `---QUESTIONS.SERVICE.FIND_GROUPED_BY_SECTION ERROR ${error}---`,
      );
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---QUESTIONS.SERVICE.FIND_ONE INIT---`);
      const question = await this.questionModel
        .findById(id)
        .populate(this.questionPopulate)
        .exec();
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
        precisionValueType:
          updateQuestionDto.precisionValueType ?? existing.precisionValueType,
        precisionOptions:
          updateQuestionDto.precisionOptions ?? existing.precisionOptions,
      });

      const sectionId =
        updateQuestionDto.section?.toString() || existing.section.toString();
      const category =
        updateQuestionDto.category ?? existing.category;
      await this.validateSection(sectionId, category);

      const updated = await this.questionModel
        .findByIdAndUpdate(
          id,
          { ...updateQuestionDto, updated_at: new Date() },
          { new: true },
        )
        .populate(this.questionPopulate)
        .exec();
      if (!updated) {
        throw new HttpException('Question non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---QUESTIONS.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(`---QUESTIONS.SERVICE.UPDATE ERROR ${error}---`);
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
