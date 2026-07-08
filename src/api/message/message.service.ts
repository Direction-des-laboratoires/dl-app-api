import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Message } from './interfaces/message.interface';
import {
  CanalEnum,
  CreateMessageDto,
  SendRegionAccessesDto,
} from './dto/create-message.dto';
import { MailService } from 'src/providers/mail-service/mail.service';
import { MailTemplates } from 'src/providers/mail-service/mail.templates';
import { PromobileSmsService } from 'src/providers/sms-service/promobile.service';
import { User } from 'src/api/user/interfaces/user.interface';
import { Lab } from 'src/api/labs/interfaces/labs.interface';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';

import { uploadFile } from 'src/utils/functions/file.upload';
import {
  flattenPhoneNumbers,
  parsePhoneNumbers,
} from 'src/utils/functions/format-senegal-phone';
import {
  buildMessageTemplateContext,
  messageHasTemplateVariables,
  renderMessageTemplate,
} from 'src/utils/functions/render-message-template';
import {
  buildRegionAccessMailHtml,
  regionAccessMailSubject,
  regionAccesMailContent,
} from './constants/region-access-mail.constants';

type RecipientContacts = {
  emails: string[];
  phoneNumbers: string[];
  userIds: string[];
};

type RegionRecipientFilter = {
  regionId: mongoose.Types.ObjectId;
  labIds: mongoose.Types.ObjectId[];
  userIds: mongoose.Types.ObjectId[];
};

@Injectable()
export class MessageService {
  constructor(
    @InjectModel('Message') private messageModel: Model<Message>,
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Lab') private labModel: Model<Lab>,
    private mailService: MailService,
    private promobileSmsService: PromobileSmsService,
  ) {}

  private readonly userPopulateForTemplate = [
    {
      path: 'lab',
      select: 'name structure',
      populate: { path: 'structure', select: 'name' },
    },
    { path: 'region', select: 'name' },
    { path: 'position', select: 'title' },
    { path: 'environment', select: 'name' },
  ];

  private findUserByEmail(
    users: Array<Record<string, any>>,
    email: string,
  ): Record<string, any> | null {
    const normalizedEmail = this.normalizeContact(email);
    return (
      users.find(
        (user) =>
          user.email &&
          this.normalizeContact(user.email) === normalizedEmail,
      ) ?? null
    );
  }

  private findUserByPhone(
    users: Array<Record<string, any>>,
    phone: string,
  ): Record<string, any> | null {
    const normalizedPhone = this.normalizePhoneForMatch(phone);
    return (
      users.find((user) =>
        flattenPhoneNumbers([
          user.phoneNumber,
          user.phoneNumber2,
          user.whatsappNumber,
        ]).some(
          (userPhone) =>
            this.normalizePhoneForMatch(userPhone) === normalizedPhone,
        ),
      ) ?? null
    );
  }

  private async loadUsersForPersonalization(
    userIds: string[],
    emails: string[],
    phones: string[],
  ): Promise<Array<Record<string, any>>> {
    const uniqueUserIds = [
      ...new Set(userIds.filter((id) => mongoose.Types.ObjectId.isValid(id))),
    ];
    const filters: Array<Record<string, unknown>> = [];

    if (uniqueUserIds.length > 0) {
      filters.push({ _id: { $in: uniqueUserIds } });
    }
    if (emails.length > 0) {
      filters.push({ email: { $in: emails } });
    }

    let users: Array<Record<string, any>> = [];
    if (filters.length > 0) {
      users = await this.userModel
        .find({ active: true, $or: filters })
        .populate(this.userPopulateForTemplate)
        .lean()
        .exec();
    }

    const knownUserIds = new Set(users.map((user) => String(user._id)));
    const unmatchedPhones = phones.filter(
      (phone) => !this.findUserByPhone(users, phone),
    );

    for (const phone of unmatchedPhones) {
      const digits = phone.replace(/\D/g, '');
      const local = digits.startsWith('221')
        ? digits.slice(3)
        : digits.replace(/^0/, '');
      if (!local) {
        continue;
      }

      const user = await this.userModel
        .findOne({
          active: true,
          $or: [
            { phoneNumber: { $regex: local } },
            { phoneNumber2: { $regex: local } },
            { whatsappNumber: { $regex: local } },
          ],
        })
        .populate(this.userPopulateForTemplate)
        .lean()
        .exec();

      if (user && !knownUserIds.has(String(user._id))) {
        users.push(user);
        knownUserIds.add(String(user._id));
      }
    }

    return users;
  }

  private personalizeMessageParts(
    subject: string,
    content: string,
    user: Record<string, any> | null,
    escapeHtml: boolean,
  ): { subject: string; content: string } {
    const context = buildMessageTemplateContext(user, { escapeHtml });
    return {
      subject: renderMessageTemplate(subject, context),
      content: renderMessageTemplate(content, context),
    };
  }

  private normalizeContact(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalizePhoneForMatch(phone: string): string {
    const cleaned = phone.trim().replace(/\s+/g, '');
    if (cleaned.startsWith('+221')) {
      return cleaned.slice(4);
    }
    if (cleaned.startsWith('221')) {
      return cleaned.slice(3);
    }
    if (cleaned.startsWith('0')) {
      return cleaned.slice(1);
    }
    return cleaned;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private generateRandomPassword(length: number = 8): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const allChars = uppercase + lowercase + numbers;

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  private excludeContacts(contacts: string[], exclusions: string[]): string[] {
    if (!exclusions || exclusions.length === 0) {
      return contacts;
    }

    const excludedContacts = new Set(
      exclusions
        .filter((contact) => contact && contact.trim() !== '')
        .map((contact) => this.normalizeContact(contact)),
    );

    return contacts.filter(
      (contact) => !excludedContacts.has(this.normalizeContact(contact)),
    );
  }

  private async sendGeneratedAccessEmail(
    user: User,
    temporaryPassword: string,
  ): Promise<void> {
    const safeEmail = this.escapeHtml(user.email);
    const safePassword = this.escapeHtml(temporaryPassword);
    const html = MailTemplates.genericEmail(
      regionAccessMailSubject,
      buildRegionAccessMailHtml({
        email: safeEmail,
        password: safePassword,
      }),
    );

    await this.mailService.sendMail({
      to: user.email,
      subject: regionAccessMailSubject,
      html,
    });
  }

  private async buildRegionRecipientFilter(
    region?: string,
  ): Promise<RegionRecipientFilter | null> {
    if (!region) {
      return null;
    }

    if (!mongoose.Types.ObjectId.isValid(region)) {
      throw new HttpException('Région invalide', HttpStatus.BAD_REQUEST);
    }

    const regionId = new mongoose.Types.ObjectId(region);
    const labs = await this.labModel
      .aggregate([
        {
          $lookup: {
            from: 'structures',
            localField: 'structure',
            foreignField: '_id',
            as: 'structureInfo',
          },
        },
        { $unwind: '$structureInfo' },
        { $match: { 'structureInfo.region': regionId } },
        { $project: { _id: 1, director: 1, responsible: 1 } },
      ])
      .exec();

    const labIds = labs.map((lab) => lab._id as mongoose.Types.ObjectId);
    const userIds = Array.from(
      new Set(
        labs
          .flatMap((lab) => [lab.director, lab.responsible])
          .filter(Boolean)
          .map((id) => String(id)),
      ),
    ).map((id) => new mongoose.Types.ObjectId(id));

    return { regionId, labIds, userIds };
  }

  private buildRegionUserMatch(regionFilter: RegionRecipientFilter): any {
    const conditions: any[] = [{ region: regionFilter.regionId }];

    if (regionFilter.labIds.length > 0) {
      conditions.push({ lab: { $in: regionFilter.labIds } });
    }

    if (regionFilter.userIds.length > 0) {
      conditions.push({ _id: { $in: regionFilter.userIds } });
    }

    return { $or: conditions };
  }

  private async filterContactsByRegion(
    emails: string[],
    phoneNumbers: string[],
    regionFilter: RegionRecipientFilter | null,
  ): Promise<{ emails: string[]; phoneNumbers: string[] }> {
    if (!regionFilter) {
      return { emails, phoneNumbers };
    }

    const users = await this.userModel
      .find({
        active: true,
        ...this.buildRegionUserMatch(regionFilter),
      })
      .select('email phoneNumber')
      .lean()
      .exec();

    const allowedEmails = new Set(
      users
        .map((user) => user.email)
        .filter((email) => email && email.trim() !== '')
        .map((email) => this.normalizeContact(email)),
    );
    const allowedPhoneNumbers = new Set(
      users
        .flatMap((user) => parsePhoneNumbers(user.phoneNumber))
        .map((phone) => this.normalizeContact(phone)),
    );

    return {
      emails: emails.filter((email) =>
        allowedEmails.has(this.normalizeContact(email)),
      ),
      phoneNumbers: flattenPhoneNumbers(phoneNumbers).filter((phone) =>
        allowedPhoneNumbers.has(this.normalizeContact(phone)),
      ),
    };
  }

  async sendRegionAccesses(
    sendRegionAccessesDto: SendRegionAccessesDto,
    sentBy: string,
  ) {
    try {
      logger.info(`---MESSAGE.SERVICE.SEND_REGION_ACCESSES INIT---`);

      const { region, exclusions = [], userIds } = sendRegionAccessesDto;
      const regionFilter = await this.buildRegionRecipientFilter(region);

      if (!regionFilter || regionFilter.labIds.length === 0) {
        throw new HttpException(
          'Aucun laboratoire trouvé pour cette région',
          HttpStatus.NOT_FOUND,
        );
      }

      const userFilters: any = {
        lab: { $in: regionFilter.labIds },
        email: { $exists: true, $ne: '' },
      };

      if (userIds && userIds.length > 0) {
        userFilters._id = { $in: userIds };
      }

      const excludedEmails = new Set(
        exclusions
          .filter((item) => item && item.trim() !== '')
          .map((item) => this.normalizeContact(item)),
      );

      const users = await this.userModel
        .find(userFilters)
        .select(
          'firstname lastname email password active isFirstLogin lab role region',
        )
        .exec();

      const targetUsers = users.filter(
        (user) => !excludedEmails.has(this.normalizeContact(user.email)),
      );
      const skippedUsers = users
        .filter((user) => excludedEmails.has(this.normalizeContact(user.email)))
        .map((user) => ({
          userId: user._id,
          email: user.email,
          reason: 'excluded',
        }));

      if (targetUsers.length === 0) {
        throw new HttpException(
          'Aucun utilisateur avec email trouvé pour les laboratoires de cette région',
          HttpStatus.BAD_REQUEST,
        );
      }

      const sent: Array<{ userId: unknown; email: string }> = [];
      const failed: Array<{ userId: unknown; email: string; error: string }> = [];

      for (const user of targetUsers) {
        const previousState = {
          password: user.password,
          active: user.active,
          isFirstLogin: user.isFirstLogin,
          updated_at: user.updated_at,
        };
        const temporaryPassword = this.generateRandomPassword(8);

        try {
          user.password = temporaryPassword;
          user.active = true;
          user.isFirstLogin = true;
          user.updated_at = new Date();
          await user.save();

          await this.sendGeneratedAccessEmail(user, temporaryPassword);
          sent.push({
            userId: user._id,
            email: user.email,
          });
        } catch (error) {
          await this.userModel.updateOne(
            { _id: user._id },
            { $set: previousState },
          );
          failed.push({
            userId: user._id,
            email: user.email,
            error: error.message || "Erreur lors de l'envoi des accès",
          });
        }
      }

      const message = await this.messageModel.create({
        subject: regionAccessMailSubject,
        content: regionAccesMailContent,
        canal: CanalEnum.EMAIL,
        emails: sent.map((item) => item.email),
        phoneNumbers: [],
        exclusions,
        region,
        sentBy,
        status: failed.length > 0 ? 'failed' : 'sent',
        sentAt: sent.length > 0 ? new Date() : null,
        errorMessage:
          failed.length > 0
            ? `${failed.length} envoi(s) échoué(s) sur ${targetUsers.length}`
            : null,
        attachments: [],
      });

      logger.info(`---MESSAGE.SERVICE.SEND_REGION_ACCESSES SUCCESS---`);
      return {
        message,
        summary: {
          totalFound: users.length,
          totalTargeted: targetUsers.length,
          sent: sent.length,
          failed: failed.length,
          skipped: skippedUsers.length,
        },
        sent,
        failed,
        skipped: skippedUsers,
      };
    } catch (error) {
      logger.error(
        `---MESSAGE.SERVICE.SEND_REGION_ACCESSES ERROR--- ${error.message}`,
      );
      throw new HttpException(
        error.message || "Erreur lors de l'envoi des accès",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async create(
    createMessageDto: CreateMessageDto,
    sentBy: string,
    files?: Express.Multer.File[],
  ) {
    try {
      logger.info(`---MESSAGE.SERVICE.CREATE INIT---`);

      const { recipients } = createMessageDto;
      const exclusions = [
        ...(createMessageDto.exclusions ?? []),
        ...(recipients.exclusions ?? []),
      ];
      const region = createMessageDto.region ?? recipients.region;
      const regionFilter = await this.buildRegionRecipientFilter(region);

      // Collecter les emails et phoneNumbers depuis les groupes
      let allEmails: string[] = [];
      let allPhoneNumbers: string[] = [];
      let allUserIds: string[] = [];

      const mergeContacts = (contacts: RecipientContacts) => {
        allEmails = [...allEmails, ...contacts.emails];
        allPhoneNumbers = [...allPhoneNumbers, ...contacts.phoneNumbers];
        allUserIds = [...allUserIds, ...contacts.userIds];
      };

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
          .select('_id email phoneNumber')
          .exec();

        mergeContacts({
          emails: users
            .map((user) => user.email)
            .filter((email) => email && email.trim() !== ''),
          phoneNumbers: users
            .map((user) => user.phoneNumber)
            .filter((phone) => phone && phone.trim() !== ''),
          userIds: users.map((user) => String(user._id)),
        });
      }

      // 4. Ajouter tous les directeurs si demandé
      if (recipients.allDirectors === true) {
        mergeContacts(await this.getDirectorsContacts());
      }

      // 5. Ajouter tous les responsables si demandé
      if (recipients.allResponsibles === true) {
        mergeContacts(await this.getResponsiblesContacts());
      }

      // 6. Ajouter tous les Super Admins si demandé
      if (recipients.allSuperAdmins === true) {
        mergeContacts(await this.getRoleContacts(Role.SuperAdmin));
      }

      // 7. Ajouter tous les Lab Admins si demandé
      if (recipients.allLabAdmins === true) {
        mergeContacts(await this.getRoleContacts(Role.LabAdmin));
      }

      // 8. Ajouter tous les Region Admins si demandé
      if (recipients.allRegionAdmins === true) {
        mergeContacts(await this.getRoleContacts(Role.RegionAdmin));
      }

      // 9. Ajouter tous les Lab Staff si demandé
      if (recipients.allStaffs === true) {
        mergeContacts(await this.getRoleContacts(Role.LabStaff));
      }

      // 10. Ajouter les utilisateurs par environmentId et ses postes sélectionnés
      if (recipients.environmentId) {
        mergeContacts(
          await this.getEnvironmentTargetedContacts(
            recipients.environmentId,
            recipients.environmentPositionIds,
          ),
        );
      }

      // Supprimer les doublons
      const uniqueEmails = [...new Set(allEmails)];
      const uniquePhoneNumbers = [
        ...new Set(flattenPhoneNumbers(allPhoneNumbers)),
      ];
      const regionFilteredContacts = await this.filterContactsByRegion(
        uniqueEmails,
        uniquePhoneNumbers,
        regionFilter,
      );
      const finalEmails =
        createMessageDto.canal === CanalEnum.EMAIL
          ? this.excludeContacts(regionFilteredContacts.emails, exclusions)
          : regionFilteredContacts.emails;
      const finalPhoneNumbers =
        createMessageDto.canal === CanalEnum.SMS ||
        createMessageDto.canal === CanalEnum.WHATSAPP
          ? this.excludeContacts(
              regionFilteredContacts.phoneNumbers,
              flattenPhoneNumbers(exclusions),
            )
          : regionFilteredContacts.phoneNumbers;

      // Validation selon le canal
      if (createMessageDto.canal === CanalEnum.EMAIL) {
        if (finalEmails.length === 0) {
          throw new HttpException(
            'Aucun destinataire email trouvé',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else if (
        createMessageDto.canal === CanalEnum.SMS ||
        createMessageDto.canal === CanalEnum.WHATSAPP
      ) {
        if (finalPhoneNumbers.length === 0) {
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
        emails: finalEmails,
        phoneNumbers: finalPhoneNumbers,
        exclusions,
        region,
        cc:
          createMessageDto.canal === CanalEnum.EMAIL
            ? createMessageDto.cc ?? []
            : [],
        cci:
          createMessageDto.canal === CanalEnum.EMAIL
            ? createMessageDto.cci ?? []
            : [],
        sentBy,
        status: 'pending',
        attachments: attachmentsUrls,
      };

      const message = new this.messageModel(messageData);
      await message.save();

      // Envoyer le message selon le canal
      try {
        if (createMessageDto.canal === CanalEnum.EMAIL) {
          await this.sendMail(message, allUserIds);
        } else if (createMessageDto.canal === CanalEnum.SMS) {
          await this.sendSms(message, allUserIds);
        } else if (createMessageDto.canal === CanalEnum.WHATSAPP) {
          await this.sendWhatsapp(message, allUserIds);
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

  private async getDirectorsContacts(): Promise<RecipientContacts> {
    const labs = await this.labModel
      .find({ director: { $exists: true, $ne: null } })
      .populate('director', 'email phoneNumber firstname lastname active')
      .select('director')
      .exec();

    const emails: string[] = [];
    const phoneNumbers: string[] = [];
    const userIds: string[] = [];

    labs.forEach((lab: any) => {
      const director = lab.director;
      if (director && director.active) {
        if (director._id) {
          userIds.push(String(director._id));
        }
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
      userIds: [...new Set(userIds)],
    };
  }

  private async getResponsiblesContacts(): Promise<RecipientContacts> {
    const labs = await this.labModel
      .find({ responsible: { $exists: true, $ne: null } })
      .populate('responsible', 'email phoneNumber firstname lastname active')
      .select('responsible')
      .exec();

    const emails: string[] = [];
    const phoneNumbers: string[] = [];
    const userIds: string[] = [];

    labs.forEach((lab: any) => {
      const responsible = lab.responsible;
      if (responsible && responsible.active) {
        if (responsible._id) {
          userIds.push(String(responsible._id));
        }
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
      userIds: [...new Set(userIds)],
    };
  }

  private async getRoleContacts(role: Role): Promise<RecipientContacts> {
    const users = await this.userModel
      .find({
        role,
        active: true,
      })
      .select('_id email phoneNumber')
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
      userIds: users.map((user) => String(user._id)),
    };
  }

  private async getEnvironmentTargetedContacts(
    environmentId: string,
    environmentPositionIds?: string[],
  ): Promise<RecipientContacts> {
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
      .select('_id email phoneNumber')
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
      userIds: users.map((user) => String(user._id)),
    };
  }

  private async sendMail(message: Message, recipientUserIds: string[] = []) {
    try {
      logger.info(`---MESSAGE.SERVICE.SEND_MAIL INIT---`);

      if (!message.emails || message.emails.length === 0) {
        throw new HttpException(
          'Aucun destinataire email fourni',
          HttpStatus.BAD_REQUEST,
        );
      }

      const attachments = message.attachments?.map((url) => {
        const filename = url.split('/').pop() || 'attachment';
        return {
          filename,
          path: url,
        };
      });

      const hasTemplateVariables =
        messageHasTemplateVariables(message.subject) ||
        messageHasTemplateVariables(message.content);

      const mailOptions = {
        cc: message.cc?.length ? message.cc : undefined,
        bcc: message.cci?.length ? message.cci : undefined,
      };

      if (!hasTemplateVariables) {
        const html = MailTemplates.genericEmail(message.subject, message.content);
        await this.mailService.sendMail({
          to: message.emails,
          subject: message.subject,
          html,
          attachments,
          ...mailOptions,
        });
      } else {
        const users = await this.loadUsersForPersonalization(
          recipientUserIds,
          message.emails ?? [],
          [],
        );

        await Promise.all(
          (message.emails ?? []).map(async (email) => {
            const user = this.findUserByEmail(users, email);
            const personalized = this.personalizeMessageParts(
              message.subject,
              message.content,
              user,
              true,
            );
            const html = MailTemplates.genericEmail(
              personalized.subject,
              personalized.content,
            );

            await this.mailService.sendMail({
              to: email,
              subject: personalized.subject,
              html,
              attachments,
              ...mailOptions,
            });
          }),
        );
      }

      logger.info(
        `---MESSAGE.SERVICE.SEND_MAIL SUCCESS--- Sent to ${message.emails.length} recipients`,
      );
    } catch (error) {
      logger.error(`---MESSAGE.SERVICE.SEND_MAIL ERROR--- ${error.message}`);
      throw error;
    }
  }

  private async sendSms(message: Message, recipientUserIds: string[] = []) {
    try {
      logger.info(`---MESSAGE.SERVICE.SEND_SMS INIT---`);

      if (!message.phoneNumbers || message.phoneNumbers.length === 0) {
        throw new HttpException(
          'Aucun numéro de téléphone fourni',
          HttpStatus.BAD_REQUEST,
        );
      }

      const users = await this.loadUsersForPersonalization(
        recipientUserIds,
        [],
        message.phoneNumbers ?? [],
      );

      const hasTemplateVariables =
        messageHasTemplateVariables(message.subject) ||
        messageHasTemplateVariables(message.content);

      const sendPromises = (message.phoneNumbers ?? []).map((phoneNumber) => {
        const user = this.findUserByPhone(users, phoneNumber);
        const personalized = hasTemplateVariables
          ? this.personalizeMessageParts(
              message.subject,
              message.content,
              user,
              false,
            )
          : { subject: message.subject, content: message.content };

        return this.promobileSmsService.sendSms({
          to: phoneNumber,
          content: `${personalized.subject}\n\n${personalized.content}`,
        });
      });

      await Promise.all(sendPromises);

      logger.info(
        `---MESSAGE.SERVICE.SEND_SMS SUCCESS--- Sent to ${message.phoneNumbers.length} recipients`,
      );
    } catch (error) {
      logger.error(`---MESSAGE.SERVICE.SEND_SMS ERROR--- ${error.message}`);
      throw error;
    }
  }

  private async sendWhatsapp(message: Message, recipientUserIds: string[] = []) {
    try {
      logger.info(`---MESSAGE.SERVICE.SEND_WHATSAPP INIT---`);

      if (!message.phoneNumbers || message.phoneNumbers.length === 0) {
        throw new HttpException(
          'Aucun numéro de téléphone fourni',
          HttpStatus.BAD_REQUEST,
        );
      }

      const users = await this.loadUsersForPersonalization(
        recipientUserIds,
        [],
        message.phoneNumbers ?? [],
      );

      const hasTemplateVariables =
        messageHasTemplateVariables(message.subject) ||
        messageHasTemplateVariables(message.content);

      const sendPromises = (message.phoneNumbers ?? []).map((phoneNumber) => {
        const user = this.findUserByPhone(users, phoneNumber);
        const personalized = hasTemplateVariables
          ? this.personalizeMessageParts(
              message.subject,
              message.content,
              user,
              false,
            )
          : { subject: message.subject, content: message.content };

        return this.promobileSmsService.sendSms({
          from: 'Fasili',
          to: phoneNumber,
          content: `${personalized.subject}\n\n${personalized.content}`,
        });
      });

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
