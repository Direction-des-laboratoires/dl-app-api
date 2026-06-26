import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { EquipmentLifeEvent } from './interfaces/equipment-life-event.interface';
import { FindEquipmentLifeEventDto } from './dto/find-equipment-life-event.dto';
import { CreateManualLifeEventDto } from './dto/create-manual-life-event.dto';
import { EquipmentLifeEventKind } from './schemas/equipment-life-event.schema';
import logger from 'src/utils/logger';
import { Role } from 'src/utils/enums/roles.enum';
import { User } from '../user/interfaces/user.interface';
import { Equipment } from '../equipments/interfaces/equipment.interface';

export type RecordLifeEventParams = {
  equipmentId: string;
  kind: EquipmentLifeEventKind;
  maintenanceId?: string;
  previousValue?: string | null;
  newValue?: string | null;
  summary: string;
  actorId?: string;
  occurredAt?: Date;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class EquipmentLifeEventsService {
  constructor(
    @InjectModel('EquipmentLifeEvent')
    private readonly model: Model<EquipmentLifeEvent>,
    @InjectModel('Equipment')
    private readonly equipmentModel: Model<Equipment>,
  ) {}

  private applyPopulates(q: any) {
    return q
      .populate('actor', 'firstname lastname email')
      .populate({
        path: 'equipment',
        select: 'serialNumber modelName brand status inventoryStatus lab',
        populate: { path: 'lab', select: 'name' },
      })
      .populate({
        path: 'maintenance',
        select:
          'status startDate endDate nextMaintenanceDate cost notes description frequency',
      });
  }

  private buildBaseMatch(
    query: FindEquipmentLifeEventDto,
  ): FilterQuery<EquipmentLifeEvent> {
    const m: FilterQuery<EquipmentLifeEvent> = {};

    if (query.kinds?.length) {
      m.kind = { $in: query.kinds };
    } else if (query.kind) {
      m.kind = query.kind;
    }

    if (query.maintenance) {
      m.maintenance = query.maintenance;
    }

    if (query.actor) {
      m.actor = query.actor;
    }

    if (query.occurredFrom || query.occurredTo) {
      m.occurredAt = {} as Record<string, Date>;
      if (query.occurredFrom) {
        (m.occurredAt as Record<string, Date>).$gte = new Date(
          query.occurredFrom,
        );
      }
      if (query.occurredTo) {
        (m.occurredAt as Record<string, Date>).$lte = new Date(
          query.occurredTo,
        );
      }
    }

    if (query.search?.trim()) {
      m.summary = {
        $regex: escapeRegex(query.search.trim()),
        $options: 'i',
      };
    }

    return m;
  }

  private async getEquipmentIdsByLab(labId: string): Promise<string[]> {
    const rows = await this.equipmentModel
      .find({ lab: labId })
      .select('_id')
      .lean();
    return rows.map((r) => String(r._id));
  }

  private emptyPaginated(page: number, limit: number) {
    return {
      data: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }

  private async assertEquipmentAccess(
    equipmentId: string,
    user: User,
  ): Promise<void> {
    if (user.role === Role.SuperAdmin) {
      return;
    }
    const eq = await this.equipmentModel
      .findById(equipmentId)
      .select('lab')
      .lean();
    if (!eq) {
      throw new HttpException('Équipement non trouvé', HttpStatus.NOT_FOUND);
    }
    const userLab = user.lab?._id?.toString() || user.lab?.toString();
    const eqLab = eq.lab?.toString?.() ?? String(eq.lab);
    if (!userLab || userLab !== eqLab) {
      throw new HttpException(
        'Accès non autorisé à la fiche de vie de cet équipement',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private mergeFilters(
    base: FilterQuery<EquipmentLifeEvent>,
    extra: FilterQuery<EquipmentLifeEvent>,
  ): FilterQuery<EquipmentLifeEvent> {
    const keysBase = Object.keys(base);
    const keysExtra = Object.keys(extra);
    if (keysBase.length === 0) {
      return extra;
    }
    if (keysExtra.length === 0) {
      return base;
    }
    return { $and: [base, extra] };
  }

  private async paginate(
    filters: FilterQuery<EquipmentLifeEvent>,
    query: FindEquipmentLifeEventDto,
  ) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const sortDir = query.sort === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.applyPopulates(
        this.model
          .find(filters)
          .sort({ occurredAt: sortDir })
          .skip(skip)
          .limit(limit),
      ).exec(),
      this.model.countDocuments(filters).exec(),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Liste filtrée avec périmètre d’accès (labo utilisateur ou SuperAdmin).
   */
  async findAll(query: FindEquipmentLifeEventDto, user: User) {
    try {
      const baseMatch = this.buildBaseMatch(query);

      if (query.equipment) {
        await this.assertEquipmentAccess(query.equipment, user);
        const filters = this.mergeFilters(baseMatch, {
          equipment: query.equipment,
        });
        return await this.paginate(filters, query);
      }

      if (user.role === Role.SuperAdmin) {
        if (query.lab) {
          const ids = await this.getEquipmentIdsByLab(query.lab);
          if (ids.length === 0) {
            const page = Number(query.page) || 1;
            const limit = Math.min(Number(query.limit) || 20, 100);
            return this.emptyPaginated(page, limit);
          }
          const filters = this.mergeFilters(baseMatch, {
            equipment: { $in: ids },
          });
          return await this.paginate(filters, query);
        }
        return await this.paginate(baseMatch, query);
      }

      const labId = user.lab?._id?.toString() || user.lab?.toString();
      if (!labId) {
        throw new HttpException(
          'Laboratoire non défini pour cet utilisateur',
          HttpStatus.BAD_REQUEST,
        );
      }

      const ids = await this.getEquipmentIdsByLab(labId);
      if (ids.length === 0) {
        const page = Number(query.page) || 1;
        const limit = Math.min(Number(query.limit) || 20, 100);
        return this.emptyPaginated(page, limit);
      }

      const filters = this.mergeFilters(baseMatch, {
        equipment: { $in: ids },
      });
      return await this.paginate(filters, query);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      logger.error(`---EQUIPMENT_LIFE_EVENTS.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string, user: User) {
    try {
      const doc = await this.applyPopulates(this.model.findById(id)).exec();
      if (!doc) {
        throw new HttpException('Événement non trouvé', HttpStatus.NOT_FOUND);
      }
      const eqId =
        (doc as any).equipment?._id != null
          ? String((doc as any).equipment._id)
          : String(doc.equipment);
      await this.assertEquipmentAccess(eqId, user);
      return doc;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      logger.error(`---EQUIPMENT_LIFE_EVENTS.FIND_ONE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createManual(dto: CreateManualLifeEventDto, user: User, actorId?: string) {
    await this.assertEquipmentAccess(dto.equipment, user);
    try {
      const created = await this.model.create({
        equipment: dto.equipment,
        kind: EquipmentLifeEventKind.MANUAL_NOTE,
        summary: dto.summary,
        actor: actorId ?? null,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      });
      return await this.applyPopulates(
        this.model.findById(created._id),
      ).exec();
    } catch (error) {
      logger.error(`---EQUIPMENT_LIFE_EVENTS.CREATE_MANUAL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string, user: User) {
    if (user.role !== Role.SuperAdmin) {
      throw new HttpException(
        'Seul un super administrateur peut supprimer un événement',
        HttpStatus.FORBIDDEN,
      );
    }
    const existing = await this.model.findById(id).exec();
    if (!existing) {
      throw new HttpException('Événement non trouvé', HttpStatus.NOT_FOUND);
    }
    await this.model.findByIdAndDelete(id).exec();
    return existing;
  }

  /**
   * Enregistre un événement ; en cas d’erreur, log seulement (ne pas bloquer l’opération métier).
   */
  async tryRecordEvent(params: RecordLifeEventParams): Promise<void> {
    try {
      await this.model.create({
        equipment: params.equipmentId,
        kind: params.kind,
        maintenance: params.maintenanceId ?? null,
        previousValue: params.previousValue ?? null,
        newValue: params.newValue ?? null,
        summary: params.summary,
        actor: params.actorId ?? null,
        occurredAt: params.occurredAt ?? new Date(),
      });
    } catch (error) {
      logger.error(
        `---EQUIPMENT_LIFE_EVENTS.RECORD ERROR ${error?.message || error}---`,
      );
    }
  }
}
