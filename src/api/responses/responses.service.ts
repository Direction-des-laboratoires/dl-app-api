import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from './interfaces/response.interface';
import { Investigation } from '../investigations/interfaces/investigation.interface';
import { InvestigationQuestion } from '../investigation-questions/interfaces/investigation-question.interface';
import { Question } from '../questions/interfaces/question.interface';
import { CreateResponseDto } from './dto/create-response.dto';
import { CreateBulkResponseDto } from './dto/create-bulk-response.dto';
import { UpdateResponseDto } from './dto/update-response.dto';
import { FindResponseDto } from './dto/find-response.dto';
import { validateResponseValue } from '../questions/utils/validate-response-value';
import { User } from '../user/interfaces/user.interface';
import { Role } from 'src/utils/enums/roles.enum';
import { assertInvestigationAcceptsResponses } from '../investigations/utils/assert-investigation-accepts-responses';
import logger from 'src/utils/logger';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectModel('Response') private responseModel: Model<Response>,
    @InjectModel('Question') private questionModel: Model<Question>,
    @InjectModel('Investigation')
    private investigationModel: Model<Investigation>,
    @InjectModel('InvestigationQuestion')
    private investigationQuestionModel: Model<InvestigationQuestion>,
  ) {}

  private async getQuestionOrThrow(questionId: string): Promise<Question> {
    const question = await this.questionModel.findById(questionId).exec();
    if (!question) {
      throw new HttpException('Question non trouvée', HttpStatus.NOT_FOUND);
    }
    return question;
  }

  private async getInvestigationOrThrow(
    investigationId: string,
  ): Promise<Investigation> {
    const investigation = await this.investigationModel
      .findById(investigationId)
      .exec();
    if (!investigation) {
      throw new HttpException('Enquête non trouvée', HttpStatus.NOT_FOUND);
    }
    return investigation;
  }

  private async validateInvestigationContext(
    investigationId: string,
    questionId: string,
  ): Promise<void> {
    const investigation = await this.getInvestigationOrThrow(investigationId);

    const link = await this.investigationQuestionModel
      .findOne({ investigation: investigationId, question: questionId })
      .exec();
    if (!link) {
      throw new HttpException(
        'Cette question ne fait pas partie de cette enquête',
        HttpStatus.BAD_REQUEST,
      );
    }

    assertInvestigationAcceptsResponses(investigation);
  }

  private readonly responsePopulate = [
    { path: 'lab', select: 'name' },
    {
      path: 'investigation',
      select: 'title active type status startDate endDate',
    },
    { path: 'question', select: 'category label responseValueType isRequired' },
  ];

  private resolveUserLabId(user: User): string {
    if (!user.lab) {
      throw new HttpException(
        'Aucun laboratoire associé à cet utilisateur',
        HttpStatus.BAD_REQUEST,
      );
    }
    const lab = user.lab as { _id?: unknown } | string;
    return typeof lab === 'object' && lab?._id != null
      ? String(lab._id)
      : String(lab);
  }

  private async persistResponse(payload: {
    lab: string;
    investigation: string;
    question: string;
    responseValue: string | number;
    responseValuePrecision?: string;
  }) {
    await this.validateInvestigationContext(
      payload.investigation,
      payload.question,
    );
    const question = await this.getQuestionOrThrow(payload.question);
    validateResponseValue(question.responseValueType, payload.responseValue);

    const response = await this.responseModel.create(payload);
    await response.populate(this.responsePopulate);
    return response;
  }

  private handleCreateError(error: unknown): never {
    logger.error(`---RESPONSES.SERVICE.CREATE ERROR ${error}---`);
    if (error instanceof HttpException) {
      throw error;
    }
    const err = error as { code?: number; message?: string; status?: number };
    if (err?.code === 11000) {
      throw new HttpException(
        'Une réponse existe déjà pour ce laboratoire, cette enquête et cette question',
        HttpStatus.CONFLICT,
      );
    }
    throw new HttpException(
      err.message,
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private resolveLab(user: User, lab?: string): string {
    if (user.role === Role.SuperAdmin) {
      if (!lab) {
        throw new HttpException(
          'Le champ lab est obligatoire pour un super administrateur',
          HttpStatus.BAD_REQUEST,
        );
      }
      return lab;
    }

    if (user.role === Role.LabAdmin) {
      return this.resolveUserLabId(user);
    }

    throw new HttpException(
      'Rôle non autorisé pour créer une réponse',
      HttpStatus.FORBIDDEN,
    );
  }

  async create(createResponseDto: CreateResponseDto, user: User) {
    try {
      logger.info(`---RESPONSES.SERVICE.CREATE INIT---`);
      const lab = this.resolveLab(user, createResponseDto.lab);
      const response = await this.persistResponse({
        lab,
        investigation: createResponseDto.investigation,
        question: createResponseDto.question,
        responseValue: createResponseDto.responseValue,
        responseValuePrecision: createResponseDto.responseValuePrecision,
      });
      logger.info(`---RESPONSES.SERVICE.CREATE SUCCESS---`);
      return response;
    } catch (error) {
      this.handleCreateError(error);
    }
  }

  async createBulk(createBulkDto: CreateBulkResponseDto, user: User) {
    try {
      logger.info(`---RESPONSES.SERVICE.CREATE_BULK INIT---`);
      const { investigation, responses } = createBulkDto;
      const lab = this.resolveLab(user, createBulkDto.lab);

      const investigationDoc = await this.getInvestigationOrThrow(investigation);
      assertInvestigationAcceptsResponses(investigationDoc);

      const questionIds = responses.map((item) => item.question);
      if (new Set(questionIds).size !== questionIds.length) {
        throw new HttpException(
          'La liste des réponses contient des questions en double',
          HttpStatus.BAD_REQUEST,
        );
      }

      const linksCount = await this.investigationQuestionModel
        .countDocuments({
          investigation,
          question: { $in: questionIds },
        })
        .exec();
      if (linksCount !== questionIds.length) {
        throw new HttpException(
          'Une ou plusieurs questions ne font pas partie de cette enquête',
          HttpStatus.BAD_REQUEST,
        );
      }

      const existingCount = await this.responseModel
        .countDocuments({
          lab,
          investigation,
          question: { $in: questionIds },
        })
        .exec();
      if (existingCount > 0) {
        throw new HttpException(
          'Une ou plusieurs réponses existent déjà pour ce laboratoire et cette enquête',
          HttpStatus.CONFLICT,
        );
      }

      const questions = await this.questionModel
        .find({ _id: { $in: questionIds } })
        .exec();
      if (questions.length !== questionIds.length) {
        throw new HttpException(
          'Une ou plusieurs questions sont introuvables',
          HttpStatus.NOT_FOUND,
        );
      }

      const questionsById = new Map(
        questions.map((q) => [q._id.toString(), q]),
      );

      const payloads = responses.map((item) => {
        const question = questionsById.get(item.question);
        validateResponseValue(question.responseValueType, item.responseValue);
        return {
          lab,
          investigation,
          question: item.question,
          responseValue: item.responseValue,
          responseValuePrecision: item.responseValuePrecision,
        };
      });

      const created = await this.responseModel.insertMany(payloads);
      const populated = await this.responseModel
        .find({ _id: { $in: created.map((r) => r._id) } })
        .populate(this.responsePopulate)
        .sort({ created_at: 1 })
        .exec();

      logger.info(`---RESPONSES.SERVICE.CREATE_BULK SUCCESS---`);
      return populated;
    } catch (error) {
      this.handleCreateError(error);
    }
  }

  async findAll(query: FindResponseDto) {
    try {
      logger.info(`---RESPONSES.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, lab, investigation, question } = query;
      const skip = (page - 1) * limit;

      const filters: Record<string, unknown> = {};
      if (lab) filters.lab = lab;
      if (investigation) filters.investigation = investigation;
      if (question) filters.question = question;

      const [data, total] = await Promise.all([
        this.responseModel
          .find(filters)
          .populate('lab', 'name')
          .populate('investigation', 'title active type status startDate endDate')
          .populate('question', 'category label responseValueType isRequired')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.responseModel.countDocuments(filters).exec(),
      ]);

      logger.info(`---RESPONSES.SERVICE.FIND_ALL SUCCESS---`);
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
      logger.error(`---RESPONSES.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---RESPONSES.SERVICE.FIND_ONE INIT---`);
      const response = await this.responseModel
        .findById(id)
        .populate(this.responsePopulate)
        .exec();
      if (!response) {
        throw new HttpException('Réponse non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---RESPONSES.SERVICE.FIND_ONE SUCCESS---`);
      return response;
    } catch (error) {
      logger.error(`---RESPONSES.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateResponseDto: UpdateResponseDto) {
    try {
      logger.info(`---RESPONSES.SERVICE.UPDATE INIT---`);
      const existing = await this.responseModel.findById(id).exec();
      if (!existing) {
        throw new HttpException('Réponse non trouvée', HttpStatus.NOT_FOUND);
      }

      const investigationId =
        updateResponseDto.investigation?.toString() ||
        existing.investigation.toString();
      const questionId =
        updateResponseDto.question?.toString() || existing.question.toString();

      if (
        updateResponseDto.investigation ||
        updateResponseDto.question ||
        updateResponseDto.responseValue !== undefined
      ) {
        await this.validateInvestigationContext(investigationId, questionId);
      }

      const question = await this.getQuestionOrThrow(questionId);
      if (updateResponseDto.responseValue !== undefined) {
        validateResponseValue(
          question.responseValueType,
          updateResponseDto.responseValue,
        );
      }

      const updated = await this.responseModel
        .findByIdAndUpdate(
          id,
          { ...updateResponseDto, updated_at: new Date() },
          { new: true },
        )
        .populate(this.responsePopulate)
        .exec();

      logger.info(`---RESPONSES.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(`---RESPONSES.SERVICE.UPDATE ERROR ${error}---`);
      if (error?.code === 11000) {
        throw new HttpException(
          'Une réponse existe déjà pour ce laboratoire, cette enquête et cette question',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---RESPONSES.SERVICE.REMOVE INIT---`);
      const deleted = await this.responseModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        throw new HttpException('Réponse non trouvée', HttpStatus.NOT_FOUND);
      }
      logger.info(`---RESPONSES.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(`---RESPONSES.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
