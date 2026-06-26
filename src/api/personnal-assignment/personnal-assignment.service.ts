import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePersonnalAssignmentDto } from './dto/create-personnal-assignment.dto';
import { UpdatePersonnalAssignmentDto } from './dto/update-personnal-assignment.dto';
import { PersonnalAssignment } from './interfaces/personnal-assignment.interface';
import logger from 'src/utils/logger';
import { Role } from 'src/utils/enums/roles.enum';
import { User } from '../user/interfaces/user.interface';



@Injectable()
export class PersonnalAssignmentService {
  constructor(
    @InjectModel('PersonnalAssignment')
    private personnalAssignmentModel: Model<PersonnalAssignment>,
    @InjectModel('User') private userModel: Model<User>,
  ) {}

  async create(
    createPersonnalAssignmentDto: CreatePersonnalAssignmentDto,
    requesterRole: string,
    requesterLabId?: string,
  ) {
    try {
      logger.info(`---PERSONNAL_ASSIGNMENT.SERVICE.CREATE INIT---`);

      // Seuls les SuperAdmin et LabAdmin peuvent créer des affectations
      const canCreate =
        requesterRole === Role.SuperAdmin || requesterRole === Role.LabAdmin;

      if (!canCreate) {
        throw new HttpException(
          "Vous n'avez pas les permissions nécessaires pour créer une affectation. Seuls les SuperAdmin et LabAdmin peuvent effectuer cette action.",
          HttpStatus.FORBIDDEN,
        );
      }

      // Si c'est un LabAdmin, vérifier qu'il appartient au même labo que l'utilisateur à transférer
      if (requesterRole === Role.LabAdmin) {
        if (!requesterLabId) {
          throw new HttpException(
            'Le LabAdmin doit être associé à un laboratoire',
            HttpStatus.BAD_REQUEST,
          );
        }

        // Récupérer l'utilisateur à transférer
        const userToTransfer = await this.userModel
          .findById(createPersonnalAssignmentDto.user)
          .select('lab')
          .lean();

        if (!userToTransfer) {
          throw new HttpException(
            "L'utilisateur à transférer n'existe pas",
            HttpStatus.NOT_FOUND,
          );
        }

        const userLabId = String(userToTransfer.lab?._id || userToTransfer.lab);
        const requesterLabIdString = String(requesterLabId);

        // Vérifier que le LabAdmin et l'utilisateur appartiennent au même labo
        if (userLabId !== requesterLabIdString) {
          throw new HttpException(
            'Vous ne pouvez transférer que les utilisateurs de votre propre laboratoire',
            HttpStatus.FORBIDDEN,
          );
        }

        // Vérifier que le fromLab correspond au labo du LabAdmin
        const fromLabIdString = String(createPersonnalAssignmentDto.fromLab);
        if (fromLabIdString !== requesterLabIdString) {
          throw new HttpException(
            "Le laboratoire d'origine doit être votre laboratoire",
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Vérifier que la date de fin est après la date de début
      if (
        new Date(createPersonnalAssignmentDto.endDate) <=
        new Date(createPersonnalAssignmentDto.startDate)
      ) {
        throw new HttpException(
          'La date de fin doit être postérieure à la date de début',
          HttpStatus.BAD_REQUEST,
        );
      }
      const assignment = await this.personnalAssignmentModel.create(
        createPersonnalAssignmentDto,
      );
      logger.info(
        `---PERSONNAL_ASSIGNMENT.SERVICE.CREATE SUCCESS--- id=${assignment._id}`,
      );
      return assignment;
    } catch (error) {
      logger.error(
        `---PERSONNAL_ASSIGNMENT.SERVICE.CREATE ERROR--- ${error.message}`,
      );
      throw new HttpException(
        error.message || "Erreur lors de la création de l'affectation",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    user?: string;
    fromLab?: string;
    toLab?: string;
  }): Promise<any> {
    try {
      logger.info(`---PERSONNAL_ASSIGNMENT.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, user, fromLab, toLab } = query;

      const filters: any = { active: true };
      if (user) filters.user = user;
      if (fromLab) filters.fromLab = fromLab;
      if (toLab) filters.toLab = toLab;

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.personnalAssignmentModel
          .find(filters)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 })
          .populate('user', 'firstname lastname email')
          .populate('fromLab', 'name')
          .populate('toLab', 'name')
          .lean(),
        this.personnalAssignmentModel.countDocuments(filters),
      ]);

      logger.info(
        `---PERSONNAL_ASSIGNMENT.SERVICE.FIND_ALL SUCCESS--- total=${total}`,
      );
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error(
        `---PERSONNAL_ASSIGNMENT.SERVICE.FIND_ALL ERROR--- ${error.message}`,
      );
      throw new HttpException(
        error.message || 'Erreur lors de la récupération des affectations',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---PERSONNAL_ASSIGNMENT.SERVICE.FIND_ONE INIT--- id=${id}`);
      const assignment = await this.personnalAssignmentModel
        .findById(id)
        .populate('user', 'firstname lastname email')
        .populate('fromLab', 'name')
        .populate('toLab', 'name')
        .exec();
      if (!assignment) {
        throw new HttpException(
          'Affectation non trouvée',
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(
        `---PERSONNAL_ASSIGNMENT.SERVICE.FIND_ONE SUCCESS--- id=${id}`,
      );
      return assignment;
    } catch (error) {
      logger.error(
        `---PERSONNAL_ASSIGNMENT.SERVICE.FIND_ONE ERROR--- ${error.message}`,
      );
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updatePersonnalAssignmentDto: UpdatePersonnalAssignmentDto,
  ) {
    try {
      logger.info(`---PERSONNAL_ASSIGNMENT.SERVICE.UPDATE INIT--- id=${id}`);
      // Vérifier les dates si elles sont fournies
      if (
        updatePersonnalAssignmentDto.startDate &&
        updatePersonnalAssignmentDto.endDate
      ) {
        if (
          new Date(updatePersonnalAssignmentDto.endDate) <=
          new Date(updatePersonnalAssignmentDto.startDate)
        ) {
          throw new HttpException(
            'La date de fin doit être postérieure à la date de début',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      const updated = await this.personnalAssignmentModel
        .findByIdAndUpdate(
          id,
          { ...updatePersonnalAssignmentDto, updated_at: new Date() },
          { new: true },
        )
        .populate('user', 'firstname lastname email')
        .populate('fromLab', 'name')
        .populate('toLab', 'name')
        .exec();
      if (!updated) {
        throw new HttpException(
          'Affectation non trouvée',
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---PERSONNAL_ASSIGNMENT.SERVICE.UPDATE SUCCESS--- id=${id}`);
      return updated;
    } catch (error) {
      logger.error(
        `---PERSONNAL_ASSIGNMENT.SERVICE.UPDATE ERROR--- ${error.message}`,
      );
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---PERSONNAL_ASSIGNMENT.SERVICE.REMOVE INIT--- id=${id}`);
      // Soft delete - désactiver au lieu de supprimer
      const deleted = await this.personnalAssignmentModel
        .findByIdAndUpdate(
          id,
          { active: false, updated_at: new Date() },
          { new: true },
        )
        .exec();
      if (!deleted) {
        throw new HttpException(
          'Affectation non trouvée',
          HttpStatus.NOT_FOUND,
        );
      }
      logger.info(`---PERSONNAL_ASSIGNMENT.SERVICE.REMOVE SUCCESS--- id=${id}`);
      return deleted;
    } catch (error) {
      logger.error(
        `---PERSONNAL_ASSIGNMENT.SERVICE.REMOVE ERROR--- ${error.message}`,
      );
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
