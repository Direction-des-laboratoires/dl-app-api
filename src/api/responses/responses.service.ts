import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from './interfaces/response.interface';
import { Question } from '../questions/interfaces/question.interface';
import { CreateResponseDto } from './dto/create-response.dto';
import { UpdateResponseDto } from './dto/update-response.dto';
import { FindResponseDto } from './dto/find-response.dto';
import { validateResponseValue } from '../questions/utils/validate-response-value';
import { User } from '../user/interfaces/user.interface';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectModel('Response') private responseModel: Model<Response>,
    @InjectModel('Question') private questionModel: Model<Question>,
  ) {}

  private async getQuestionOrThrow(questionId: string): Promise<Question> {
    const question = await this.questionModel.findById(questionId).exec();
    if (!question) {
      throw new HttpException('Question non trouvée', HttpStatus.NOT_FOUND);
    }
    return question;
  }

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
    question: string;
    responseValue: string | number;
    responseValuePrecision?: string;
  }) {
    const question = await this.getQuestionOrThrow(payload.question);
    validateResponseValue(question.responseValueType, payload.responseValue);

    const response = await this.responseModel.create(payload);
    await response.populate([
      { path: 'lab', select: 'name' },
      { path: 'question', select: 'category label responseValueType isRequired' },
    ]);
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
        'Une réponse existe déjà pour ce laboratoire et cette question',
        HttpStatus.CONFLICT,
      );
    }
    throw new HttpException(
      err.message,
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private resolveLabForCreate(
    createResponseDto: CreateResponseDto,
    user: User,
  ): string {
    if (user.role === Role.SuperAdmin) {
      if (!createResponseDto.lab) {
        throw new HttpException(
          'Le champ lab est obligatoire pour un super administrateur',
          HttpStatus.BAD_REQUEST,
        );
      }
      return createResponseDto.lab;
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
      const lab = this.resolveLabForCreate(createResponseDto, user);
      const response = await this.persistResponse({
        question: createResponseDto.question,
        responseValue: createResponseDto.responseValue,
        responseValuePrecision: createResponseDto.responseValuePrecision,
        lab,
      });
      logger.info(`---RESPONSES.SERVICE.CREATE SUCCESS---`);
      return response;
    } catch (error) {
      this.handleCreateError(error);
    }
  }

  async findAll(query: FindResponseDto) {
    try {
      logger.info(`---RESPONSES.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, lab, question } = query;
      const skip = (page - 1) * limit;

      const filters: Record<string, unknown> = {};
      if (lab) filters.lab = lab;
      if (question) filters.question = question;

      const [data, total] = await Promise.all([
        this.responseModel
          .find(filters)
          .populate('lab', 'name')
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
        .populate('lab', 'name')
        .populate('question', 'category label responseValueType isRequired')
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

      const questionId =
        updateResponseDto.question?.toString() || existing.question.toString();
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
        .populate('lab', 'name')
        .populate('question', 'category label responseValueType isRequired')
        .exec();

      logger.info(`---RESPONSES.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(`---RESPONSES.SERVICE.UPDATE ERROR ${error}---`);
      if (error?.code === 11000) {
        throw new HttpException(
          'Une réponse existe déjà pour ce laboratoire et cette question',
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
