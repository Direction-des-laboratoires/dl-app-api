import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { FindMaintenanceDto } from './dto/find-maintenance.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Maintenance } from './entities/maintenance.entity';
import logger from 'src/utils/logger';
import {
  MaintenanceStatus,
  MaintenanceType,
  ScheduleFrequency,
} from './schemas/maintenance.schema';

import { Role } from 'src/utils/enums/roles.enum';
import { User } from '../user/interfaces/user.interface';
import { buildStatisticsFilters } from 'src/utils/functions/filter-builder';
import { StatisticsFilterDto } from 'src/utils/dto/statistics-filter.dto';

@Injectable()
export class MaintenancesService {
  constructor(
    @InjectModel('Maintenance')
    private maintenanceModel: Model<Maintenance>,
    @InjectModel('Equipment')
    private equipmentModel: Model<any>,
    @InjectModel('User')
    private userModel: Model<any>,
    @InjectModel('Lab')
    private labModel: Model<any>,
    @InjectModel('Structure')
    private structureModel: Model<any>,
  ) {}

  private calculateNextDate(
    date: Date,
    frequency: ScheduleFrequency,
  ): Date | null {
    const nextDate = new Date(date);
    switch (frequency) {
      case ScheduleFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case ScheduleFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case ScheduleFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case ScheduleFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case ScheduleFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case ScheduleFrequency.ONCE:
      default:
        return null;
    }
    return nextDate;
  }

  async create(createMaintenanceDto: CreateMaintenanceDto) {
    try {
      logger.info(`---MAINTENANCES.SERVICE.CREATE INIT---`);

      const maintenanceDate = createMaintenanceDto.date
        ? new Date(createMaintenanceDto.date)
        : new Date();

      // 1. Si la maintenance est déjà "COMPLETED", on enregistre la date de réalisation
      if (createMaintenanceDto.status === MaintenanceStatus.COMPLETED) {
        createMaintenanceDto.lastMaintenanceDate = maintenanceDate;

        // Calcul de la prochaine date si une fréquence est définie
        if (
          createMaintenanceDto.frequency &&
          createMaintenanceDto.frequency !== ScheduleFrequency.ONCE
        ) {
          createMaintenanceDto.nextMaintenanceDate = this.calculateNextDate(
            maintenanceDate,
            createMaintenanceDto.frequency as ScheduleFrequency,
          );
        }
      } else {
        // Si elle n'est pas terminée (ex: SCHEDULED), la date prévue est la prochaine date
        createMaintenanceDto.nextMaintenanceDate = maintenanceDate;
      }

      const maintenance = await this.maintenanceModel.create(
        createMaintenanceDto,
      );
      await maintenance.populate({
        path: 'equipment',
        populate: {
          path: 'equipmentType',
          select: 'name model brand serialNumber',
        },
      });
      await maintenance.populate(
        'technician',
        'firstname lastname phoneNumber email',
      );
      logger.info(`---MAINTENANCES.SERVICE.CREATE SUCCESS---`);
      return maintenance;
    } catch (error) {
      logger.error(`---MAINTENANCES.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindMaintenanceDto) {
    try {
      logger.info(`---MAINTENANCES.SERVICE.FIND_ALL INIT---`);
      const {
        page = 1,
        limit = 10,
        search,
        equipment,
        maintenanceType,
        status,
        technician,
        frequency,
      } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (equipment) filters.equipment = equipment;
      if (maintenanceType) filters.maintenanceType = maintenanceType;
      if (status) filters.status = status;
      if (technician) filters.technician = technician;
      if (frequency) filters.frequency = frequency;

      if (search) {
        const [equipmentIds, technicianIds] = await Promise.all([
          this.equipmentModel
            .find({
              $or: [
                { serialNumber: { $regex: search, $options: 'i' } },
                { modelName: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
              ],
            })
            .select('_id')
            .lean(),
          this.userModel
            .find({
              $or: [
                { firstname: { $regex: search, $options: 'i' } },
                { lastname: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
              ],
            })
            .select('_id')
            .lean(),
        ]);

        filters.$or = [
          { description: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
          { equipment: { $in: equipmentIds.map((e) => e._id) } },
          { technician: { $in: technicianIds.map((t) => t._id) } },
        ];
      }

      const [data, total] = await Promise.all([
        this.maintenanceModel
          .find(filters)
          .populate({
            path: 'equipment',
            populate: {
              path: 'equipmentType',
              select: 'name model brand serialNumber',
            },
          })
          .populate('technician', 'firstname lastname phoneNumber email')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.maintenanceModel.countDocuments(filters).exec(),
      ]);

      logger.info(`---MAINTENANCES.SERVICE.FIND_ALL SUCCESS---`);
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
      logger.error(`---MAINTENANCES.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---MAINTENANCES.SERVICE.FIND_ONE INIT---`);
      const maintenance = await this.maintenanceModel
        .findById(id)
        .populate({
          path: 'equipment',
          populate: {
            path: 'equipmentType',
            select: 'name model brand serialNumber',
          },
        })
        .populate('technician', 'firstname lastname phoneNumber email')
        .exec();
      if (!maintenance) {
        throw new HttpException(
          'Enregistrement de maintenance non trouvé',
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---MAINTENANCES.SERVICE.FIND_ONE SUCCESS---`);
      return maintenance;
    } catch (error) {
      logger.error(`---MAINTENANCES.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateMaintenanceDto: UpdateMaintenanceDto) {
    try {
      logger.info(`---MAINTENANCES.SERVICE.UPDATE INIT--- id=${id}`);

      // Récupérer la maintenance actuelle pour comparer le statut
      const current = await this.maintenanceModel.findById(id);
      if (!current) {
        throw new HttpException(
          'Enregistrement de maintenance non trouvé',
          HttpStatus.NOT_FOUND,
        );
      }

      // Si le statut passe à COMPLETED, ou si on met à jour une maintenance déjà COMPLETED
      const newStatus = updateMaintenanceDto.status || current.status;
      if (newStatus === MaintenanceStatus.COMPLETED) {
        const maintenanceDate = updateMaintenanceDto.date
          ? new Date(updateMaintenanceDto.date)
          : current.date || new Date();

        updateMaintenanceDto.lastMaintenanceDate = maintenanceDate;

        const frequency =
          (updateMaintenanceDto.frequency as ScheduleFrequency) ||
          current.frequency;
        if (frequency && frequency !== ScheduleFrequency.ONCE) {
          updateMaintenanceDto.nextMaintenanceDate = this.calculateNextDate(
            maintenanceDate,
            frequency,
          );
        }
      } else {
        // Si le statut n'est pas COMPLETED (ex: SCHEDULED)
        // On met à jour nextMaintenanceDate si la date ou la fréquence change
        if (updateMaintenanceDto.date) {
          updateMaintenanceDto.nextMaintenanceDate = new Date(
            updateMaintenanceDto.date,
          );
        }
      }

      const updated = await this.maintenanceModel
        .findByIdAndUpdate(
          id,
          { ...updateMaintenanceDto, updated_at: new Date() },
          { new: true },
        )
        .populate({
          path: 'equipment',
          populate: {
            path: 'equipmentType',
            select: 'name model brand',
          },
        })
        .populate('technician', 'firstname lastname phoneNumber email')
        .exec();

      logger.info(`---MAINTENANCES.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(`---MAINTENANCES.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---MAINTENANCES.SERVICE.REMOVE INIT---`);
      const deleted = await this.maintenanceModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        throw new HttpException(
          'Enregistrement de maintenance non trouvé',
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---MAINTENANCES.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(`---MAINTENANCES.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getStatistics(user: User, query: StatisticsFilterDto): Promise<any> {
    try {
      logger.info(`---MAINTENANCES.SERVICE.GET_STATISTICS INIT---`);

      const filters = await buildStatisticsFilters(
        user,
        query,
        this.labModel,
        this.structureModel,
        'date',
      );

      const pipeline: any[] = [];

      // Toujours faire le lookup pour pouvoir filtrer par lab via l'équipement
      pipeline.push(
        {
          $lookup: {
            from: 'equipments',
            localField: 'equipment',
            foreignField: '_id',
            as: 'equipmentData',
          },
        },
        { $unwind: '$equipmentData' },
      );

      // Appliquer les filtres
      const matchFilters: any = {};
      if (filters.date) matchFilters.date = filters.date;
      if (filters.lab) matchFilters['equipmentData.lab'] = filters.lab;

      if (Object.keys(matchFilters).length > 0) {
        pipeline.push({ $match: matchFilters });
      }

      const [
        total,
        byStatus,
        byType,
        byFrequency,
        upcomingCount,
        overdueCount,
      ] = await Promise.all([
        this.maintenanceModel.aggregate([...pipeline, { $count: 'count' }]),
        this.maintenanceModel.aggregate([
          ...pipeline,
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        this.maintenanceModel.aggregate([
          ...pipeline,
          { $group: { _id: '$maintenanceType', count: { $sum: 1 } } },
        ]),
        this.maintenanceModel.aggregate([
          ...pipeline,
          { $group: { _id: '$frequency', count: { $sum: 1 } } },
        ]),
        // Maintenances prévues dans les 30 prochains jours
        this.maintenanceModel.aggregate([
          ...pipeline,
          {
            $match: {
              status: MaintenanceStatus.SCHEDULED,
              nextMaintenanceDate: {
                $gte: new Date(),
                $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
          { $count: 'count' },
        ]),
        // Maintenances en retard (SCHEDULED et date dépassée)
        this.maintenanceModel.aggregate([
          ...pipeline,
          {
            $match: {
              status: MaintenanceStatus.SCHEDULED,
              nextMaintenanceDate: { $lt: new Date() },
            },
          },
          { $count: 'count' },
        ]),
      ]);

      logger.info(`---MAINTENANCES.SERVICE.GET_STATISTICS SUCCESS---`);
      return {
        total: total[0]?.count || 0,
        byStatus: Object.values(MaintenanceStatus).reduce((acc: any, status) => {
          const found = byStatus.find((s) => s._id === status);
          acc[status] = found ? found.count : 0;
          return acc;
        }, {}),
        byType: Object.values(MaintenanceType).reduce((acc: any, type) => {
          const found = byType.find((t) => t._id === type);
          acc[type] = found ? found.count : 0;
          return acc;
        }, {}),
        byFrequency: Object.values(ScheduleFrequency).reduce(
          (acc: any, frequency) => {
            const found = byFrequency.find((f) => f._id === frequency);
            acc[frequency] = found ? found.count : 0;
            return acc;
          },
          {},
        ),
        upcomingCount: upcomingCount[0]?.count || 0,
        overdueCount: overdueCount[0]?.count || 0,
      };
    } catch (error) {
      logger.error(`---MAINTENANCES.SERVICE.GET_STATISTICS ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
