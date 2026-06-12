import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Investigation } from './interfaces/investigation.interface';
import { InvestigationQuestion } from '../investigation-questions/interfaces/investigation-question.interface';
import { Question } from '../questions/interfaces/question.interface';
import { Lab } from '../labs/interfaces/labs.interface';
import { Response } from '../responses/interfaces/response.interface';
import { CreateInvestigationDto } from './dto/create-investigation.dto';
import { UpdateInvestigationDto } from './dto/update-investigation.dto';
import { FindInvestigationDto } from './dto/find-investigation.dto';
import { FindInvestigationQuestionsDto } from './dto/find-investigation-questions.dto';
import { FindInvestigationResponsesByLabDto } from './dto/find-investigation-responses-by-lab.dto';
import { validateInvestigationDates } from './utils/validate-investigation-dates';
import { LabResponseStatusEnum } from 'src/utils/enums/lab-response-status.enum';
import logger from 'src/utils/logger';

@Injectable()
export class InvestigationsService {
  constructor(
    @InjectModel('Investigation')
    private investigationModel: Model<Investigation>,
    @InjectModel('InvestigationQuestion')
    private investigationQuestionModel: Model<InvestigationQuestion>,
    @InjectModel('Question') private questionModel: Model<Question>,
    @InjectModel('Lab') private labModel: Model<Lab>,
    @InjectModel('Response') private responseModel: Model<Response>,
    @InjectModel('Structure') private structureModel: Model<Record<string, unknown>>,
  ) {}

  private readonly labPopulate = [
    {
      path: 'type',
      select: 'name code description active',
    },
    {
      path: 'structure',
      populate: [{ path: 'region department district', select: 'name code' }],
    },
    {
      path: 'specialities',
      select: 'name description',
    },
    {
      path: 'director',
      select: 'email firstname lastname phoneNumber',
    },
    {
      path: 'responsible',
      select: 'email firstname lastname phoneNumber',
    },
  ];

  private readonly responseQuestionPopulate = {
    path: 'question',
    select:
      'section category label responseValueType isRequired responsePrecisionCondition precisionLabel precisionValueType precisionOptions options',
    populate: { path: 'section', select: 'name category order' },
  };

  private async buildLabFilters(
    query: FindInvestigationResponsesByLabDto,
  ): Promise<Record<string, unknown> | null> {
    const {
      lab,
      structure,
      type,
      region,
      department,
      district,
      name,
      search,
      specialities,
    } = query;

    const labFilters: Record<string, unknown> = {};

    if (lab) labFilters._id = lab;
    if (structure) labFilters.structure = structure;
    if (type) labFilters.type = type;
    if (name) labFilters.name = { $regex: name, $options: 'i' };

    if (search) {
      const structureIdsFromSearch = await this.structureModel
        .find({ name: { $regex: search, $options: 'i' } })
        .select('_id')
        .exec();

      labFilters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        {
          structure: { $in: structureIdsFromSearch.map((s) => s._id) },
        },
      ];
    }

    if (specialities && specialities.length > 0) {
      const specialityIds = specialities.map((id) => {
        if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
          return new mongoose.Types.ObjectId(id);
        }
        return id;
      });
      labFilters.specialities = { $in: specialityIds };
    }

    if (region || department || district) {
      const structureFilters: Record<string, unknown> = {};
      if (region) structureFilters.region = region;
      if (department) structureFilters.department = department;
      if (district) structureFilters.district = district;

      const matchingStructures = await this.structureModel
        .find(structureFilters)
        .select('_id')
        .exec();

      const structureIds = matchingStructures.map((s) => s._id);

      if (structureIds.length === 0) {
        return null;
      }

      if (labFilters.structure) {
        const structureIdStr = String(labFilters.structure);
        const matchingStructureIds = structureIds.map((id) => String(id));
        if (!matchingStructureIds.includes(structureIdStr)) {
          return null;
        }
      } else {
        labFilters.structure = { $in: structureIds };
      }
    }

    return labFilters;
  }

  private getLabResponseStatus(
    answeredCount: number,
    totalQuestions: number,
  ): LabResponseStatusEnum {
    if (answeredCount === 0) {
      return LabResponseStatusEnum.NOT_RESPONDED;
    }
    if (totalQuestions > 0 && answeredCount >= totalQuestions) {
      return LabResponseStatusEnum.COMPLETE;
    }
    return LabResponseStatusEnum.PARTIAL;
  }

  private matchesResponseStatusFilter(
    status: LabResponseStatusEnum,
    filter?: LabResponseStatusEnum,
  ): boolean {
    if (!filter) return true;
    if (filter === LabResponseStatusEnum.RESPONDED) {
      return status !== LabResponseStatusEnum.NOT_RESPONDED;
    }
    return status === filter;
  }

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
            populate: { path: 'section', select: 'name category order' },
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

  async findQuestionsGroupedBySection(id: string) {
    try {
      logger.info(`---INVESTIGATIONS.SERVICE.FIND_QUESTIONS_GROUPED_BY_SECTION INIT---`);
      const investigation = await this.investigationModel.findById(id).lean().exec();
      if (!investigation) {
        throw new HttpException('Enquête non trouvée', HttpStatus.NOT_FOUND);
      }

      const questionSelect =
        'section category label responseValueType isRequired responsePrecisionCondition precisionLabel precisionValueType precisionOptions options';

      const investigationQuestions = await this.investigationQuestionModel
        .find({ investigation: id })
        .populate({
          path: 'question',
          select: questionSelect,
          populate: { path: 'section', select: 'name category order' },
        })
        .sort({ order: 1, created_at: 1 })
        .lean()
        .exec();

      const sectionMap = new Map<
        string,
        {
          _id: unknown;
          name: string;
          category: string;
          order?: number;
          questions: Array<Record<string, unknown>>;
        }
      >();

      for (const item of investigationQuestions) {
        const question = item.question as Question & {
          section?: { _id: unknown; name: string; category: string; order?: number };
        };
        if (!question?.section) continue;

        const section =
          typeof question.section === 'object' ? question.section : null;
        if (!section) continue;

        const sectionId = String(section._id);
        if (!sectionMap.has(sectionId)) {
          sectionMap.set(sectionId, {
            _id: section._id,
            name: section.name,
            category: section.category,
            order: section.order,
            questions: [],
          });
        }

        sectionMap.get(sectionId).questions.push({
          _id: item._id,
          order: item.order,
          question,
        });
      }

      const data = Array.from(sectionMap.values()).sort((a, b) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });

      logger.info(
        `---INVESTIGATIONS.SERVICE.FIND_QUESTIONS_GROUPED_BY_SECTION SUCCESS---`,
      );
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
        totalSections: data.length,
        totalQuestions: investigationQuestions.length,
      };
    } catch (error) {
      logger.error(
        `---INVESTIGATIONS.SERVICE.FIND_QUESTIONS_GROUPED_BY_SECTION ERROR ${error}---`,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findResponsesByLab(
    id: string,
    query: FindInvestigationResponsesByLabDto = {},
  ) {
    try {
      logger.info(`---INVESTIGATIONS.SERVICE.FIND_RESPONSES_BY_LAB INIT---`);

      const investigation = await this.investigationModel.findById(id).lean().exec();
      if (!investigation) {
        throw new HttpException('Enquête non trouvée', HttpStatus.NOT_FOUND);
      }

      const {
        page = 1,
        limit = 10,
        paginate = true,
        hasResponded,
        isComplete,
        responseStatus,
      } = query;
      const shouldPaginate = paginate !== false;

      const labFilters = await this.buildLabFilters(query);
      if (labFilters === null) {
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
          stats: {
            totalLabs: 0,
            respondedLabs: 0,
            notRespondedLabs: 0,
            partialLabs: 0,
            completedLabs: 0,
            totalQuestions: 0,
            totalResponses: 0,
            responseRate: 0,
          },
          data: [],
          ...(shouldPaginate
            ? {
                pagination: {
                  total: 0,
                  page,
                  limit,
                  totalPages: 0,
                },
              }
            : {}),
        };
      }

      const totalQuestions = await this.investigationQuestionModel
        .countDocuments({ investigation: id })
        .exec();

      const [labs, responses] = await Promise.all([
        this.labModel
          .find(labFilters)
          .populate(this.labPopulate)
          .sort({ name: 1 })
          .lean()
          .exec(),
        this.responseModel
          .find({ investigation: id })
          .populate(this.responseQuestionPopulate)
          .sort({ created_at: 1 })
          .lean()
          .exec(),
      ]);

      const labIds = new Set(labs.map((lab) => String(lab._id)));
      const responsesByLab = new Map<string, Array<Record<string, unknown>>>();

      for (const response of responses) {
        const labId = String(response.lab);
        if (!labIds.has(labId)) continue;
        if (!responsesByLab.has(labId)) {
          responsesByLab.set(labId, []);
        }
        responsesByLab.get(labId).push(response as Record<string, unknown>);
      }

      let allItems = labs.map((lab) => {
        const labId = String(lab._id);
        const labResponses = responsesByLab.get(labId) ?? [];
        const answeredCount = labResponses.length;
        const status = this.getLabResponseStatus(answeredCount, totalQuestions);
        const completionRate =
          totalQuestions > 0
            ? Math.round((answeredCount / totalQuestions) * 100)
            : 0;

        return {
          lab,
          hasResponded: answeredCount > 0,
          isComplete:
            totalQuestions > 0 && answeredCount >= totalQuestions,
          responseStatus: status,
          answeredCount,
          totalQuestions,
          completionRate,
          responses: labResponses,
        };
      });

      if (hasResponded !== undefined) {
        allItems = allItems.filter(
          (item) => item.hasResponded === hasResponded,
        );
      }

      if (isComplete !== undefined) {
        allItems = allItems.filter((item) => item.isComplete === isComplete);
      }

      if (responseStatus) {
        allItems = allItems.filter((item) =>
          this.matchesResponseStatusFilter(item.responseStatus, responseStatus),
        );
      }

      const respondedLabs = allItems.filter((item) => item.hasResponded).length;
      const notRespondedLabs = allItems.filter(
        (item) => !item.hasResponded,
      ).length;
      const partialLabs = allItems.filter(
        (item) => item.responseStatus === LabResponseStatusEnum.PARTIAL,
      ).length;
      const completedLabs = allItems.filter((item) => item.isComplete).length;
      const totalResponses = allItems.reduce(
        (sum, item) => sum + item.answeredCount,
        0,
      );
      const totalLabs = allItems.length;
      const responseRate =
        totalLabs > 0 ? Math.round((respondedLabs / totalLabs) * 100) : 0;

      const stats = {
        totalLabs,
        respondedLabs,
        notRespondedLabs,
        partialLabs,
        completedLabs,
        totalQuestions,
        totalResponses,
        responseRate,
      };

      let data = allItems;
      let pagination: Record<string, number> | undefined;

      if (shouldPaginate) {
        const skip = (page - 1) * limit;
        data = allItems.slice(skip, skip + limit);
        pagination = {
          total: totalLabs,
          page,
          limit,
          totalPages: Math.ceil(totalLabs / limit),
        };
      }

      logger.info(`---INVESTIGATIONS.SERVICE.FIND_RESPONSES_BY_LAB SUCCESS---`);
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
        stats,
        data,
        ...(pagination ? { pagination } : {}),
      };
    } catch (error) {
      logger.error(
        `---INVESTIGATIONS.SERVICE.FIND_RESPONSES_BY_LAB ERROR ${error}---`,
      );
      if (error instanceof HttpException) {
        throw error;
      }
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
          populate: { path: 'section', select: 'name category order' },
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
