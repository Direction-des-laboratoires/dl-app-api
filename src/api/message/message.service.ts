import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './interfaces/message.interface';
import { CanalEnum, CreateMessageDto } from './dto/create-message.dto';
import { MailService } from 'src/providers/mail-service/mail.service';
import { MailTemplates } from 'src/providers/mail-service/mail.templates';
import { PromobileSmsService } from 'src/providers/sms-service/promobile.service';
import { User } from 'src/api/user/interfaces/user.interface';
import { Lab } from 'src/api/labs/interfaces/labs.interface';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';

import { uploadFile } from 'src/utils/functions/file.upload';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel('Message') private messageModel: Model<Message>,
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Lab') private labModel: Model<Lab>,
    private mailService: MailService,
    private promobileSmsService: PromobileSmsService,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    sentBy: string,
    files?: Express.Multer.File[],
  ) {
    try {
      logger.info(`---MESSAGE.SERVICE.CREATE INIT---`);

      const { recipients } = createMessageDto;

      // Collecter les emails et phoneNumbers depuis les groupes
      let allEmails: string[] = [];
      let allPhoneNumbers: string[] = [];

      // 1. Ajouter les emails directs
      if (recipients.emails && recipients.emails.length > 0) {
        allEmails = [...allEmails, ...recipients.emails];
      }


      // 2. Ajouter les phoneNumbers directs
      if (recipients.phoneNumbers && recipients.phoneNumbers.length > 0) {
        allPhoneNumbers = [...allPhoneNumbers, ...recipients.phoneNumbers];
      }

      // 3. Récupérer les emails/phoneNumbers depuis les userIds
      if (recipients.userIds && recipients.userIds.length > 0) {
        const users = await this.userModel
          .find({
            _id: { $in: recipients.userIds },
            active: true,
          })
          .select('email phoneNumber')
          .exec();

        const userEmails = users
          .map((user) => user.email)
          .filter((email) => email && email.trim() !== '');
        allEmails = [...allEmails, ...userEmails];

        const userPhoneNumbers = users
          .map((user) => user.phoneNumber)
          .filter((phone) => phone && phone.trim() !== '');
        allPhoneNumbers = [...allPhoneNumbers, ...userPhoneNumbers];
      }

      // 4. Ajouter tous les directeurs si demandé
      if (recipients.allDirectors === true) {
        const { emails, phoneNumbers } = await this.getDirectorsContacts();
        allEmails = [...allEmails, ...emails];
        allPhoneNumbers = [...allPhoneNumbers, ...phoneNumbers];
      }

      // 5. Ajouter tous les responsables si demandé
      if (recipients.allResponsibles === true) {
        const { emails, phoneNumbers } = await this.getResponsiblesContacts();
        allEmails = [...allEmails, ...emails];
        allPhoneNumbers = [...allPhoneNumbers, ...phoneNumbers];
      }

      // 6. Ajouter tous les Super Admins si demandé
      if (recipients.allSuperAdmins === true) {
        const { emails, phoneNumbers } = await this.getRoleContacts(
          Role.SuperAdmin,
        );
        allEmails = [...allEmails, ...emails];
        allPhoneNumbers = [...allPhoneNumbers, ...phoneNumbers];
      }

      // 7. Ajouter tous les Lab Admins si demandé
      if (recipients.allLabAdmins === true) {
        const { emails, phoneNumbers } = await this.getRoleContacts(
          Role.LabAdmin,
        );
        allEmails = [...allEmails, ...emails];
        allPhoneNumbers = [...allPhoneNumbers, ...phoneNumbers];
      }

      // 8. Ajouter tous les Region Admins si demandé
      if (recipients.allRegionAdmins === true) {
        const { emails, phoneNumbers } = await this.getRoleContacts(
          Role.RegionAdmin,
        );
        allEmails = [...allEmails, ...emails];
        allPhoneNumbers = [...allPhoneNumbers, ...phoneNumbers];
      }

      // 9. Ajouter tous les Lab Staff si demandé
      if (recipients.allStaffs === true) {
        const { emails, phoneNumbers } = await this.getRoleContacts(
          Role.LabStaff,
        );
        allEmails = [...allEmails, ...emails];
        allPhoneNumbers = [...allPhoneNumbers, ...phoneNumbers];
      }

      // 10. Ajouter les utilisateurs par environmentId et ses postes sélectionnés
      if (recipients.environmentId) {
        const { emails, phoneNumbers } = await this.getEnvironmentTargetedContacts(
          recipients.environmentId,
          recipients.environmentPositionIds,
        );
        allEmails = [...allEmails, ...emails];
        allPhoneNumbers = [...allPhoneNumbers, ...phoneNumbers];
      }

      // Supprimer les doublons
      const uniqueEmails = [...new Set(allEmails)];
      const uniquePhoneNumbers = [...new Set(allPhoneNumbers)];

      // Validation selon le canal
      if (createMessageDto.canal === CanalEnum.EMAIL) {
        if (uniqueEmails.length === 0) {
          throw new HttpException(
            'Aucun destinataire email trouvé',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else if (
        createMessageDto.canal === CanalEnum.SMS ||
        createMessageDto.canal === CanalEnum.WHATSAPP
      ) {
        if (uniquePhoneNumbers.length === 0) {
          throw new HttpException(
            'Aucun numéro de téléphone trouvé',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Traiter les fichiers joints
      const attachmentsUrls: string[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            const url = await uploadFile(file);
            attachmentsUrls.push(url);
          } catch (uploadError) {
            logger.error(`---MESSAGE.SERVICE.UPLOAD_FILE ERROR--- ${uploadError.message}`);
          }
        }
      }

      // Créer le message dans la base de données
      const messageData: any = {
        subject: createMessageDto.subject,
        content: createMessageDto.content,
        canal: createMessageDto.canal,
        emails: uniqueEmails,
        phoneNumbers: uniquePhoneNumbers,
        sentBy,
        status: 'pending',
        attachments: attachmentsUrls,
      };

      const message = new this.messageModel(messageData);
      await message.save();

      // Envoyer le message selon le canal
      try {
        if (createMessageDto.canal === CanalEnum.EMAIL) {
          await this.sendMail(message);
        } else if (createMessageDto.canal === CanalEnum.SMS) {
          await this.sendSms(message);
        } else if (createMessageDto.canal === CanalEnum.WHATSAPP) {
          await this.sendWhatsapp(message);
        }

        // Mettre à jour le statut à 'sent'
        message.status = 'sent';
        message.sentAt = new Date();
        await message.save();

        logger.info(`---MESSAGE.SERVICE.CREATE SUCCESS---`);
        return message;
      } catch (sendError) {
        // Mettre à jour le statut à 'failed' en cas d'erreur
        message.status = 'failed';
        message.errorMessage = sendError.message || "Erreur lors de l'envoi";
        await message.save();

        logger.error(
          `---MESSAGE.SERVICE.CREATE SEND ERROR--- ${sendError.message}`,
        );
        throw new HttpException(
          `Erreur lors de l'envoi du message: ${sendError.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      logger.error(`---MESSAGE.SERVICE.CREATE ERROR--- ${error.message}`);
      throw new HttpException(
        error.message || 'Erreur lors de la création du message',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getDirectorsContacts(): Promise<{
    emails: string[];
    phoneNumbers: string[];
  }> {
    const labs = await this.labModel
      .find({ director: { $exists: true, $ne: null } })
      .populate('director', 'email phoneNumber firstname lastname active')
      .select('director')
      .exec();

    const emails: string[] = [];
    const phoneNumbers: string[] = [];

    labs.forEach((lab: any) => {
      const director = lab.director;
      if (director && director.active) {
        if (director.email && director.email.trim() !== '') {
          emails.push(director.email);
        }
        if (director.phoneNumber && director.phoneNumber.trim() !== '') {
          phoneNumbers.push(director.phoneNumber);
        }
      }
    });

    return {
      emails: [...new Set(emails)],
      phoneNumbers: [...new Set(phoneNumbers)],
    };
  }

  private async getResponsiblesContacts(): Promise<{
    emails: string[];
    phoneNumbers: string[];
  }> {
    const labs = await this.labModel
      .find({ responsible: { $exists: true, $ne: null } })
      .populate('responsible', 'email phoneNumber firstname lastname active')
      .select('responsible')
      .exec();

    const emails: string[] = [];
    const phoneNumbers: string[] = [];

    labs.forEach((lab: any) => {
      const responsible = lab.responsible;
      if (responsible && responsible.active) {
        if (responsible.email && responsible.email.trim() !== '') {
          emails.push(responsible.email);
        }
        if (responsible.phoneNumber && responsible.phoneNumber.trim() !== '') {
          phoneNumbers.push(responsible.phoneNumber);
        }
      }
    });

    return {
      emails: [...new Set(emails)],
      phoneNumbers: [...new Set(phoneNumbers)],
    };
  }

  private async getRoleContacts(role: Role): Promise<{
    emails: string[];
    phoneNumbers: string[];
  }> {
    const users = await this.userModel
      .find({
        role,
        active: true,
      })
      .select('email phoneNumber')
      .exec();

    const emails = users
      .map((user) => user.email)
      .filter((email) => email && email.trim() !== '');

    const phoneNumbers = users
      .map((user) => user.phoneNumber)
      .filter((phone) => phone && phone.trim() !== '');

    return {
      emails: [...new Set(emails)],
      phoneNumbers: [...new Set(phoneNumbers)],
    };
  }

  private async getEnvironmentTargetedContacts(
    environmentId: string,
    environmentPositionIds?: string[],
  ): Promise<{
    emails: string[];
    phoneNumbers: string[];
  }> {
    const filters: any = {
      environment: environmentId,
      active: true,
    };

    // Si des postes sont spécifiés, on filtre par ces postes au sein de l'environnement
    if (environmentPositionIds && environmentPositionIds.length > 0) {
      filters.environmentPosition = { $in: environmentPositionIds };
    }

    const users = await this.userModel
      .find(filters)
      .select('email phoneNumber')
      .exec();

    const emails = users
      .map((user) => user.email)
      .filter((email) => email && email.trim() !== '');

    const phoneNumbers = users
      .map((user) => user.phoneNumber)
      .filter((phone) => phone && phone.trim() !== '');

    return {
      emails: [...new Set(emails)],
      phoneNumbers: [...new Set(phoneNumbers)],
    };
  }

  private async sendMail(message: Message) {
    try {
      logger.info(`---MESSAGE.SERVICE.SEND_MAIL INIT---`);

      if (!message.emails || message.emails.length === 0) {
        throw new HttpException(
          'Aucun destinataire email fourni',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Préparer le contenu HTML
      const html = MailTemplates.genericEmail(message.subject, message.content);

      // Préparer les pièces jointes pour nodemailer
      const attachments = message.attachments?.map((url) => {
        const filename = url.split('/').pop() || 'attachment';
        return {
          filename,
          path: url, // Nodemailer peut gérer les URLs si le serveur le permet, sinon il faudra le chemin local
        };
      });

      // Envoyer l'email à tous les destinataires
      await this.mailService.sendMail({
        to: message.emails,
        subject: message.subject,
        html,
        attachments,
      });

      logger.info(
        `---MESSAGE.SERVICE.SEND_MAIL SUCCESS--- Sent to ${message.emails.length} recipients`,
      );
    } catch (error) {
      logger.error(`---MESSAGE.SERVICE.SEND_MAIL ERROR--- ${error.message}`);
      throw error;
    }
  }

  private async sendSms(message: Message) {
    try {
      logger.info(`---MESSAGE.SERVICE.SEND_SMS INIT---`);

      if (!message.phoneNumbers || message.phoneNumbers.length === 0) {
        throw new HttpException(
          'Aucun numéro de téléphone fourni',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Envoyer le SMS à chaque destinataire
      const sendPromises = message.phoneNumbers.map((phoneNumber) =>
        this.promobileSmsService.sendSms({
          from: 'Fasili',
          to: phoneNumber,
          content: `${message.subject}\n\n${message.content}`,
        }),
      );

      await Promise.all(sendPromises);

      logger.info(
        `---MESSAGE.SERVICE.SEND_SMS SUCCESS--- Sent to ${message.phoneNumbers.length} recipients`,
      );
    } catch (error) {
      logger.error(`---MESSAGE.SERVICE.SEND_SMS ERROR--- ${error.message}`);
      throw error;
    }
  }

  private async sendWhatsapp(message: Message) {
    try {
      logger.info(`---MESSAGE.SERVICE.SEND_WHATSAPP INIT---`);

      if (!message.phoneNumbers || message.phoneNumbers.length === 0) {
        throw new HttpException(
          'Aucun numéro de téléphone fourni',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Pour l'instant, on utilise le même service SMS pour WhatsApp
      // TODO: Implémenter un service WhatsApp dédié si nécessaire
      const sendPromises = message.phoneNumbers.map((phoneNumber) =>
        this.promobileSmsService.sendSms({
          from: 'Fasili',
          to: phoneNumber,
          content: `${message.subject}\n\n${message.content}`,
        }),
      );

      await Promise.all(sendPromises);

      logger.info(
        `---MESSAGE.SERVICE.SEND_WHATSAPP SUCCESS--- Sent to ${message.phoneNumbers.length} recipients`,
      );
    } catch (error) {
      logger.error(
        `---MESSAGE.SERVICE.SEND_WHATSAPP ERROR--- ${error.message}`,
      );
      throw error;
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    canal?: string;
    status?: string;
    search?: string;
  }): Promise<any> {
    try {
      logger.info(`---MESSAGE.SERVICE.FIND_ALL INIT---`);

      const { page = 1, limit = 10, canal, status, search } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (canal) filters.canal = canal;
      if (status) filters.status = status;

      // Recherche globale dans subject, content, emails, phoneNumbers
      if (search && search.trim() !== '') {
        const searchRegex = new RegExp(search.trim(), 'i');
        filters.$or = [
          { subject: { $regex: searchRegex } },
          { content: { $regex: searchRegex } },
          { emails: searchRegex },
          { phoneNumbers: searchRegex },
        ];
      }

      const [data, total] = await Promise.all([
        this.messageModel
          .find(filters)
          .populate({
            path: 'sentBy',
            select: 'email firstname lastname',
          })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.messageModel.countDocuments(filters),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error(`---MESSAGE.SERVICE.FIND_ALL ERROR--- ${error.message}`);
      throw new HttpException(
        error.message || 'Erreur lors de la récupération des messages',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<Message> {
    try {
      logger.info(`---MESSAGE.SERVICE.FIND_ONE INIT--- id=${id}`);

      const message = await this.messageModel
        .findById(id)
        .populate({
          path: 'sentBy',
          select: 'email firstname lastname',
        })
        .lean();

      if (!message) {
        throw new HttpException('Message non trouvé', HttpStatus.NOT_FOUND);
      }

      logger.info(`---MESSAGE.SERVICE.FIND_ONE SUCCESS--- id=${id}`);
      return message as any;
    } catch (error) {
      logger.error(`---MESSAGE.SERVICE.FIND_ONE ERROR--- ${error.message}`);
      throw new HttpException(
        error.message || 'Erreur lors de la récupération du message',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
