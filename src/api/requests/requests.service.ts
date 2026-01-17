import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from './entities/request.entity';
import { RequestComment } from '../request-comment/interfaces/request-comment.interface';
import { FindRequestsDto } from './dto/find-requests.dto';
import logger from 'src/utils/logger';
import { RequestStatusEnum } from 'src/utils/enums/request-status.enum';
import { RequestTypeEnum } from 'src/utils/enums/request-type.enum';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel('Request') private requestModel: Model<Request>,
    @InjectModel('RequestComment')
    private requestCommentModel: Model<RequestComment>,
  ) {}

  async findAll(filters: FindRequestsDto) {
    try {
      logger.info('-----REQUESTS.SERVICE.FINDALL-----INIT');

      const query: any = {};

      // Filtre par type
      if (filters.type) {
        query.type = filters.type;
      }

      // Filtre par status
      if (filters.status) {
        query.status = filters.status;
      }

      // Filtre par utilisateur
      if (filters.userId) {
        query.user = filters.userId;
      }

      // Filtre par date (entre startDate et endDate)
      if (filters.startDate || filters.endDate) {
        query.created_at = {};
        if (filters.startDate) {
          query.created_at.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.created_at.$lte = new Date(filters.endDate);
        }
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      // Exécuter la requête avec pagination
      const [requests, total] = await Promise.all([
        this.requestModel
          .find(query)
          .populate('user', 'firstname lastname phoneNumber email')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.requestModel.countDocuments(query).exec(),
      ]);

      logger.info(
        `-----REQUESTS.SERVICE.FINDALL-----SUCCESS: found ${requests.length} requests (total: ${total})`,
      );

      return {
        data: requests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`-----REQUESTS.SERVICE.FINDALL-----ERROR: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      logger.info(`-----REQUESTS.SERVICE.FINDONE-----INIT: id=${id}`);
      const request = await this.requestModel
        .findById(id)
        .populate('user', 'firstname lastname email')
        .lean()
        .exec();
      if (!request) {
        logger.warn(`-----REQUESTS.SERVICE.FINDONE-----NOT FOUND: id=${id}`);
        throw new HttpException('Demande non trouvée', HttpStatus.NOT_FOUND);
      }

      // Récupérer les commentaires associés à la demande
      const comments = await this.requestCommentModel
        .find({ request: id })
        .populate('author', 'firstname lastname phoneNumber email')
        .sort({ created_at: -1 })
        .lean()
        .exec();

      logger.info(`-----REQUESTS.SERVICE.FINDONE-----SUCCESS: id=${id}`);
      return { ...request, comments };
    } catch (error) {
      logger.error(
        `-----REQUESTS.SERVICE.FINDONE-----ERROR: id=${id}, error=${error.message}`,
      );
      throw error;
    }
  }

  async getStatistics() {
    try {
      logger.info('-----REQUESTS.SERVICE.GETSTATISTICS-----INIT');
      const [total, byType, byStatus] = await Promise.all([
        this.requestModel.countDocuments().exec(),
        this.requestModel
          .aggregate([
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
              },
            },
          ])
          .exec(),
        this.requestModel
          .aggregate([
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ])
          .exec(),
      ]);

      const statistics = {
        total,
        byType: Object.values(RequestTypeEnum).reduce((acc: any, type) => {
          const found = byType.find((t) => t._id === type);
          acc[type] = found ? found.count : 0;
          return acc;
        }, {}),
        byStatus: Object.values(RequestStatusEnum).reduce((acc: any, status) => {
          const found = byStatus.find((s) => s._id === status);
          acc[status] = found ? found.count : 0;
          return acc;
        }, {}),
      };

      logger.info(
        `-----REQUESTS.SERVICE.GETSTATISTICS-----SUCCESS: total=${total}`,
      );
      return statistics;
    } catch (error) {
      logger.error(
        `-----REQUESTS.SERVICE.GETSTATISTICS-----ERROR: ${error.message}`,
      );
      throw error;
    }
  }
}
