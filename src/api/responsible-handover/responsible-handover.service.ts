import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import logger from 'src/utils/logger';
import { Role } from 'src/utils/enums/roles.enum';
import { sanitizeUserObject } from 'src/utils/functions/sanitizer';
import { MailService } from 'src/providers/mail-service/mail.service';
import { User } from '../user/interfaces/user.interface';
import { Lab } from '../labs/interfaces/labs.interface';
import {
  HandoverStatus,
  ResponsibleHandover,
} from './interfaces/responsible-handover.interface';
import { CreateHandoverDto } from './dto/create-handover.dto';
import { ReplaceResponsibleDto } from './dto/replace-responsible.dto';
import { FindHandoverDto } from './dto/find-handover.dto';

@Injectable()
export class ResponsibleHandoverService {
  constructor(
    @InjectModel('ResponsibleHandover')
    private handoverModel: Model<ResponsibleHandover>,
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Lab') private labModel: Model<Lab>,
    @InjectModel('StaffLevel') private staffLevelModel: Model<any>,
    private mailService: MailService,
  ) {}

  private normalizeValue(value: any): string | null {
    if (value === undefined || value === null) return null;
    const normalized = String(value).replace(/ /g, ' ').trim();
    return normalized === '' ? null : normalized;
  }

  /**
   * Charge un utilisateur et s'assure qu'il est bien responsable de labo (lab_admin).
   */
  private async getLabAdminOrThrow(userId: string): Promise<User> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new HttpException('Identifiant invalide', HttpStatus.BAD_REQUEST);
    }
    const user = await this.userModel
      .findById(userId)
      .populate({ path: 'lab', select: 'name phoneNumber email structure' })
      .exec();

    if (!user) {
      throw new HttpException('Utilisateur introuvable', HttpStatus.NOT_FOUND);
    }
    if (user.role !== Role.LabAdmin) {
      throw new HttpException(
        "Cet utilisateur n'est pas un responsable de laboratoire",
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }

  /**
   * Retourne les informations publiques du responsable de labo (page publique, sans token).
   */
  async verifyResponsible(userId: string) {
    try {
      logger.info(`---RESPONSIBLE_HANDOVER.SERVICE.VERIFY INIT---`);
      const user = await this.getLabAdminOrThrow(userId);
      const sanitized = sanitizeUserObject(
        user.toObject ? user.toObject() : user,
      );
      logger.info(`---RESPONSIBLE_HANDOVER.SERVICE.VERIFY SUCCESS---`);
      return {
        isLabAdmin: true,
        userId: String(user._id),
        firstname: sanitized.firstname,
        lastname: sanitized.lastname,
        email: sanitized.email,
        phoneNumber: sanitized.phoneNumber,
        lab: sanitized.lab,
      };
    } catch (error) {
      logger.error(`---RESPONSIBLE_HANDOVER.SERVICE.VERIFY ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la vérification du responsable',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Enregistre la réponse du responsable :
   *  - stillResponsible = true  : confirme ses infos (mises à jour) -> statut confirmed
   *  - stillResponsible = false : signale un changement -> statut pending (visible en BO)
   */
  async createHandover(userId: string, dto: CreateHandoverDto) {
    try {
      logger.info(`---RESPONSIBLE_HANDOVER.SERVICE.CREATE INIT---`);
      const user = await this.getLabAdminOrThrow(userId);
      const stillResponsible = dto.stillResponsible === true;

      if (stillResponsible) {
        // Mise à jour des coordonnées confirmées si fournies
        const info = dto.newResponsible || {};
        const updates: any = {};
        const firstname = this.normalizeValue(info.firstname);
        const lastname = this.normalizeValue(info.lastname);
        const email = this.normalizeValue(info.email);
        const phoneNumber = this.normalizeValue(info.phoneNumber);
        if (firstname) updates.firstname = firstname;
        if (lastname) updates.lastname = lastname;
        if (email) updates.email = email;
        if (phoneNumber) updates.phoneNumber = phoneNumber;
        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date();
          await this.userModel.findByIdAndUpdate(user._id, updates).exec();
        }
      }

      const labId =
        (user.lab as any)?._id?.toString() || (user.lab as any)?.toString();

      const handover = await this.handoverModel.create({
        lab: labId,
        previousResponsible: user._id,
        stillResponsible,
        newResponsible: stillResponsible ? {} : dto.newResponsible || {},
        status: stillResponsible
          ? HandoverStatus.Confirmed
          : HandoverStatus.Pending,
      });

      logger.info(`---RESPONSIBLE_HANDOVER.SERVICE.CREATE SUCCESS---`);
      return handover;
    } catch (error) {
      logger.error(`---RESPONSIBLE_HANDOVER.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message || "Erreur lors de l'enregistrement",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindHandoverDto): Promise<any> {
    try {
      const { page = 1, limit = 10, paginate = true, status, lab } = query;
      const shouldPaginate = paginate !== false;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (status) filters.status = status;
      if (lab) filters.lab = lab;

      if (!shouldPaginate) {
        const data = await this.handoverModel
          .find(filters)
          .sort({ created_at: -1 })
          .exec();
        return { data };
      }

      const [data, total] = await Promise.all([
        this.handoverModel
          .find(filters)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.handoverModel.countDocuments(filters).exec(),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error(`---RESPONSIBLE_HANDOVER.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    const handover = await this.handoverModel.findById(id).exec();
    if (!handover) {
      throw new HttpException('Signalement introuvable', HttpStatus.NOT_FOUND);
    }
    return handover;
  }

  /**
   * Crée (ou réutilise) l'utilisateur responsable de labo (lab_admin).
   * Reprend la logique de LabsService.createManagerForLab.
   */
  private async createLabAdminUser(
    info: ReplaceResponsibleDto,
    labId: string,
  ): Promise<User> {
    const email = this.normalizeValue(info.email);
    const phoneNumber = this.normalizeValue(info.phoneNumber);
    const firstname = this.normalizeValue(info.firstname);
    const lastname = this.normalizeValue(info.lastname);

    // Réutilise un compte existant pour éviter les collisions d'index uniques
    const existing = await this.userModel
      .findOne({ $or: [{ email }, { phoneNumber }] })
      .exec();
    if (existing) {
      await this.userModel
        .findByIdAndUpdate(existing._id, {
          lab: labId,
          role: Role.LabAdmin,
          active: true,
          updated_at: new Date(),
        })
        .exec();
      return existing;
    }

    const defaultLevel = await this.staffLevelModel.findOne({ rank: 2 }).exec(); // Doctor
    if (!defaultLevel?._id) {
      throw new HttpException(
        'Aucun niveau de personnel trouvé pour créer le responsable',
        HttpStatus.BAD_REQUEST,
      );
    }

    const plainPassword = Math.random().toString(36).slice(-10) + 'A1';

    const created = await this.userModel.create({
      firstname,
      lastname,
      email,
      phoneNumber,
      role: Role.LabAdmin,
      nationality: 'Sénégalaise',
      entryDate: new Date(),
      lab: labId,
      level: defaultLevel._id,
      password: plainPassword,
    });

    try {
      const fullName = `${firstname} ${lastname}`.trim();
      // await this.mailService.sendWelcomeEmail(
      //   email,
      //   fullName || 'Utilisateur',
      //   plainPassword,
      // );
    } catch (mailError) {
      logger.error(
        `---RESPONSIBLE_HANDOVER.SERVICE.SEND_ACCESS_EMAIL ERROR--- ${mailError.message}`,
      );
      // Ne bloque pas si l'envoi email échoue
    }

    return created;
  }

  /**
   * Remplace le responsable : crée le nouveau lab_admin, rattache le labo,
   * désactive l'ancien responsable et clôture le signalement.
   */
  async replace(id: string, dto: ReplaceResponsibleDto, adminUserId?: string) {
    try {
      logger.info(`---RESPONSIBLE_HANDOVER.SERVICE.REPLACE INIT---`);
      const handover = await this.findOne(id);

      if (handover.status === HandoverStatus.Processed) {
        throw new HttpException(
          'Ce signalement a déjà été traité',
          HttpStatus.BAD_REQUEST,
        );
      }

      const labId =
        (handover.lab as any)?._id?.toString() ||
        (handover.lab as any)?.toString();
      if (!labId) {
        throw new HttpException(
          'Aucun laboratoire associé à ce signalement',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 1. Créer / réutiliser le nouveau responsable
      const newUser = await this.createLabAdminUser(dto, labId);

      // 2. Rattacher le labo au nouveau responsable
      await this.labModel
        .findByIdAndUpdate(labId, {
          responsible: newUser._id,
          updated_at: new Date(),
        })
        .exec();

      // 3. Désactiver l'ancien responsable (sans le supprimer)
      const previousId =
        (handover.previousResponsible as any)?._id?.toString() ||
        (handover.previousResponsible as any)?.toString();
      if (previousId && previousId !== String(newUser._id)) {
        await this.userModel
          .findByIdAndUpdate(previousId, {
            active: false,
            updated_at: new Date(),
          })
          .exec();
      }

      // 4. Clôturer le signalement
      handover.status = HandoverStatus.Processed;
      handover.processedBy = adminUserId as any;
      handover.newResponsibleUser = newUser._id as any;
      handover.updated_at = new Date();
      await handover.save();

      logger.info(`---RESPONSIBLE_HANDOVER.SERVICE.REPLACE SUCCESS---`);
      return {
        handover,
        newResponsible: sanitizeUserObject(
          (newUser as any).toObject ? (newUser as any).toObject() : newUser,
        ),
      };
    } catch (error) {
      logger.error(`---RESPONSIBLE_HANDOVER.SERVICE.REPLACE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors du remplacement du responsable',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
