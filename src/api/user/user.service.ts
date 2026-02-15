/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateLabStaffDto, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from './interfaces/user.interface';
import logger from 'src/utils/logger';
import { CreateAuthDto } from '../auth/dto/create-auth.dto';
import * as bcrypt from 'bcrypt';
import { sanitizeUser } from 'src/utils/functions/sanitizer';
import { Role } from 'src/utils/enums/roles.enum';
import { MailService } from 'src/providers/mail-service/mail.service';
import { uploadFile } from 'src/utils/functions/file.upload';
import { ProfessionalExperience } from '../professional-experience/interfaces/professional-experience.interface';
import { Training } from '../training/interfaces/training.interface';
import { Lab } from '../labs/interfaces/labs.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('ProfessionalExperience')
    private professionalExperienceModel: Model<ProfessionalExperience>,
    @InjectModel('Training') private trainingModel: Model<Training>,
    @InjectModel('Lab') private labModel: Model<Lab>,
    private mailService: MailService,
  ) {}
  /**
   * Génère un mot de passe aléatoire de 8 caractères
   */
  private generateRandomPassword(length: number = 8): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const allChars = uppercase + lowercase + numbers;

    let password = '';
    // S'assurer qu'on a au moins un caractère de chaque type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    // Compléter avec des caractères aléatoires
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Mélanger les caractères pour plus de sécurité
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  async create(
    createUserDto: CreateUserDto | CreateLabStaffDto,
    files?: Express.Multer.File[],
  ) {
    try {
      logger.info(`---USER.SERVICE.CREATE INIT---`);
      //await this.checkPhoneNumber(createUserDto.phoneNumber);

      // Traiter l'upload de la photo de profil si présente
      let profilePhotoUrl: string | undefined;
      let cvUrl: string | undefined;
      let presentationVideoUrl: string | undefined;
      const profilePhotoFile = files?.find(
        (file) =>
          file.fieldname === 'profilePhoto' || file.fieldname === 'photo',
      );
      const cvFile = files?.find((file) => file.fieldname === 'cv');
      const presentationVideoFile = files?.find(
        (file) =>
          file.fieldname === 'videoPresentation' ||
          file.fieldname === 'presentationVideo' ||
          file.fieldname === 'video',
      );
      if (profilePhotoFile) {
        try {
          profilePhotoUrl = await uploadFile(profilePhotoFile);
          logger.info(
            `---USER.SERVICE.UPLOAD_PROFILE_PHOTO SUCCESS--- url=${profilePhotoUrl}`,
          );
        } catch (uploadError) {
          logger.error(
            `---USER.SERVICE.UPLOAD_PROFILE_PHOTO ERROR--- ${uploadError.message}`,
          );
          throw new HttpException(
            `Erreur lors de l'upload de la photo de profil: ${uploadError.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }
      if (cvFile) {
        try {
          cvUrl = await uploadFile(cvFile);
          logger.info(`---USER.SERVICE.UPLOAD_CV SUCCESS--- url=${cvUrl}`);
        } catch (uploadError) {
          logger.error(`---USER.SERVICE.UPLOAD_CV ERROR--- ${uploadError.message}`);
          throw new HttpException(
            `Erreur lors de l'upload du CV: ${uploadError.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }
      if (presentationVideoFile) {
        try {
          presentationVideoUrl = await uploadFile(presentationVideoFile);
          logger.info(
            `---USER.SERVICE.UPLOAD_PRESENTATION_VIDEO SUCCESS--- url=${presentationVideoUrl}`,
          );
        } catch (uploadError) {
          logger.error(
            `---USER.SERVICE.UPLOAD_PRESENTATION_VIDEO ERROR--- ${uploadError.message}`,
          );
          throw new HttpException(
            `Erreur lors de l'upload de la video de presentation: ${uploadError.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      const user = new this.userModel(createUserDto);
      const password = this.generateRandomPassword(8);
      user.password = password;
      if (profilePhotoUrl) {
        user.profilePhoto = profilePhotoUrl;
      }
      if (cvUrl) {
        user.cv = cvUrl;
      }
      if (presentationVideoUrl) {
        user.videoPresentation = presentationVideoUrl;
      }
      await user.save();
      logger.info(`---USER.SERVICE.CREATE SUCCESS---`);

      // Envoyer les accès par email si l'utilisateur a un email
      if (user.email) {
        try {
          const fullName =
            `${user.firstname || ''} ${user.lastname || ''}`.trim() ||
            'Utilisateur';
          await this.mailService.sendWelcomeEmail(
            user.email,
            fullName,
            password,
          );
          logger.info(
            `---USER.SERVICE.SEND_ACCESS_EMAIL SUCCESS--- email=${user.email}`,
          );
        } catch (mailError) {
          logger.error(
            `---USER.SERVICE.SEND_ACCESS_EMAIL ERROR--- ${mailError.message}`,
          );
          // Ne pas faire échouer la création si l'email échoue
        }
      } else {
        logger.warn(
          `---USER.SERVICE.SEND_ACCESS_EMAIL SKIPPED--- no email provided`,
        );
      }

      return sanitizeUser(user);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async createLabAdminAccount(
    createLabAdminDto: CreateUserDto | CreateLabStaffDto,
  ) {
    try {
      logger.info(`---USER.SERVICE.CREATE_LAB_ADMIN_ACCOUNT INIT---`);
      const payload = {
        ...createLabAdminDto,
        role: Role.LabAdmin,
        active: false,
      };
      const user = await this.create(payload as any);
      logger.info(`---USER.SERVICE.CREATE_LAB_ADMIN_ACCOUNT SUCCESS---`);
      return user;
    } catch (error) {
      logger.error(
        `---USER.SERVICE.CREATE_LAB_ADMIN_ACCOUNT ERROR--- ${error.message}`,
      );
      throw new HttpException(
        error.message || 'Erreur lors de la creation du compte LabAdmin',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createMultiple(usersDto: CreateUserDto[]) {
    try {
      logger.info(`---USER.SERVICE.CREATE_MULTIPLE INIT--- count=${usersDto.length}`);
      const results = [];
      const errors = [];

      for (const userDto of usersDto) {
        try {
          const result = await this.create(userDto);
          results.push(result);
        } catch (error) {
          errors.push({
            user: `${userDto.firstname} ${userDto.lastname}`,
            email: userDto.email,
            error: error.message,
          });
        }
      }

      logger.info(`---USER.SERVICE.CREATE_MULTIPLE SUCCESS--- created=${results.length}, failed=${errors.length}`);
      return {
        message: `${results.length} utilisateurs créés avec succès`,
        data: results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erreur lors de la création multiple',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getStats(query: {
    region?: string;
    district?: string;
    lab?: string;
  }): Promise<any> {
    try {
      logger.info(`---USER.SERVICE.GET_STATS INIT---`);
      const { region, district, lab } = query;

      const filters: any = { active: true };

      // Si un lab est spécifié, on l'utilise directement
      if (lab) {
        filters.lab = new mongoose.Types.ObjectId(lab);
      } 
      // Sinon, si region ou district est spécifié, on cherche les labs correspondants
      else if (region || district) {
        const structureFilters: any = {};
        if (region) structureFilters.region = new mongoose.Types.ObjectId(region);
        if (district) structureFilters.district = new mongoose.Types.ObjectId(district);

        // Trouver les structures
        const labs = await this.labModel.aggregate([
          {
            $lookup: {
              from: 'structures',
              localField: 'structure',
              foreignField: '_id',
              as: 'structureInfo',
            },
          },
          { $unwind: '$structureInfo' },
          {
            $match: {
              $or: [
                { 'structureInfo.region': structureFilters.region },
                { 'structureInfo.district': structureFilters.district },
              ].filter(f => Object.values(f)[0] !== undefined)
            }
          },
          { $project: { _id: 1 } }
        ]);

        const labIds = labs.map(l => l._id);
        
        // Pour les stats, on inclut aussi les RegionAdmin de cette région
        if (region) {
          filters.$or = [
            { lab: { $in: labIds } },
            { region: new mongoose.Types.ObjectId(region) }
          ];
        } else {
          filters.lab = { $in: labIds };
        }
      }

      const stats = await this.userModel.aggregate([
        { $match: filters },
        {
          $facet: {
            total: [{ $count: 'count' }],
            byGender: [
              { $group: { _id: '$gender', count: { $sum: 1 } } }
            ],
            byRole: [
              { $group: { _id: '$role', count: { $sum: 1 } } }
            ],
            byEnvironment: [
              {
                $lookup: {
                  from: 'environments',
                  localField: 'environment',
                  foreignField: '_id',
                  as: 'envInfo',
                },
              },
              { $unwind: { path: '$envInfo', preserveNullAndEmptyArrays: true } },
              { $group: { _id: '$envInfo.name', count: { $sum: 1 } } }
            ],
            byContractType: [
              {
                $lookup: {
                  from: 'contracttypes',
                  localField: 'contractType',
                  foreignField: '_id',
                  as: 'contractInfo',
                },
              },
              { $unwind: { path: '$contractInfo', preserveNullAndEmptyArrays: true } },
              { $group: { _id: '$contractInfo.name', count: { $sum: 1 } } }
            ]
          }
        }
      ]);

      const result = stats[0];
      return {
        total: result.total[0]?.count || 0,
        byGender: result.byGender,
        byRole: result.byRole,
        byEnvironment: result.byEnvironment,
        byContractType: result.byContractType,
      };
    } catch (error) {
      logger.error(`---USER.SERVICE.GET_STATS ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la récupération des statistiques',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    firstname?: string;
    lastname?: string;
    bloodGroup?: string;
    email?: string;
    lab?: string;
    environment?: string;
    environmentPosition?: string;
    level?: string;
    region?: string;
    role?: string;
    active?: boolean;
    specialities?: string[];
    search?: string;
    contractType?: string;
    gender?: string;
    maritalStatus?: string;
    disabled?: boolean;
  }): Promise<any> {
    try {
      const {
        page = 1,
        limit = 10,
        firstname,
        lastname,
        bloodGroup,
        email,
        lab,
        environment,
        environmentPosition,
        level,
        region,
        role,
        active,
        specialities,
        search,
        contractType,
        gender,
        maritalStatus,
        disabled,
      } = query;

      const filters: any = {};

      // Si search est fourni, rechercher dans firstname, lastname, email et phoneNumber
      if (search) {
        filters.$or = [
          { firstname: { $regex: search, $options: 'i' } },
          { lastname: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
        ];
      } else {
        // Sinon, utiliser les filtres individuels
        if (firstname) filters.firstname = { $regex: firstname, $options: 'i' };
        if (lastname) filters.lastname = { $regex: lastname, $options: 'i' };
        if (email) filters.email = { $regex: email, $options: 'i' };
      }

      if (bloodGroup)
        filters.bloodGroup = { $regex: `^${bloodGroup}$`, $options: 'i' };
      if (lab) filters.lab = lab;
      if (environment) filters.environment = environment;
      if (environmentPosition) filters.environmentPosition = environmentPosition;
      if (level) filters.level = level;
      if (region) filters.region = region;
      if (contractType) filters.contractType = contractType;
      if (gender) filters.gender = gender;
      if (maritalStatus) filters.maritalStatus = maritalStatus;
      if (disabled !== undefined) filters.disabled = disabled;

      if (role && role !== Role.SdrAdmin) {
        filters.role = role;
      } else {
        // Toujours exclure les SDR de la liste générale des utilisateurs
        filters.role = { $ne: Role.SdrAdmin };
      }

      if (active !== undefined) filters.active = active;
      if (specialities && specialities.length > 0) {
        // Filtrer les users qui ont au moins une des spécialités fournies
        const specialityIds = specialities.map((id) => {
          if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
            return new mongoose.Types.ObjectId(id);
          }
          return id;
        });
        filters.specialities = { $in: specialityIds };
      }

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.userModel
          .find(filters)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 })
          .select('-password')
          .populate({
            path: 'lab',
            select: 'structure name',
            populate: [{ path: 'structure', select: 'name type' }],
          })
          .populate('environment')
          .populate({
            path: 'environmentPosition',
            populate: { path: 'position' },
          })
          .populate('contractType')
          .populate({
            path: 'level',
            select: 'name description',
          })
          .populate({
            path: 'specialities',
            select: 'name description',
          })
          .lean(),
        this.userModel.countDocuments(filters),
      ]);

      return {
        data,
        limit,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || 500,
      );
    }
  }

  async findSDRs(query: {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
    region?: string;
  }): Promise<any> {
    try {
      const { page = 1, limit = 10, search, active, region } = query;

      const filters: any = { role: Role.SdrAdmin };

      if (search) {
        filters.$or = [
          { firstname: { $regex: search, $options: 'i' } },
          { lastname: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
        ];
      }

      if (active !== undefined) filters.active = active;
      if (region) filters.region = region;

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.userModel
          .find(filters)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 })
          .select('-password')
          .populate('region', 'name code')
          .lean(),
        this.userModel.countDocuments(filters),
      ]);

      return {
        data,
        limit,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || 500,
      );
    }
  }

  async findOne(userId: string): Promise<any> {
    try {
      const user = await this.userModel
        .findById(userId)
        .select('-password')
        .populate({
          path: 'lab',
          select: 'structure name',
          populate: [{ path: 'structure', select: 'name' }],
        })
        .populate('environment')
        .populate({
          path: 'environmentPosition',
          populate: { path: 'position' },
        })
        .populate('contractType')
        .populate({
          path: 'level',
          select: 'name description',
        })
        .populate({
          path: 'specialities',
          select: 'name description',
        })
        .lean();
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<any> {
    try {
      const user = await this.userModel
        .findOne({ phoneNumber, active: true })
        .populate({
          path: 'level',
          select: 'name description',
        })
        .lean();
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async findByEmail(email: string): Promise<any> {
    try {
      const user = await this.userModel
        .findOne({ email, active: true }).populate('lab')
        .populate('environment')
        .populate({
          path: 'environmentPosition',
          populate: { path: 'position' },
        })
        .populate('contractType')
        .populate({
          path: 'level',
          select: 'name description',
        })
        .populate({
          path: 'specialities',
          select: 'name description',
        })
        .lean();
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async checkPhoneNumber(phoneNumber: string) {
    try {
      const user = await this.userModel.findOne({
        phoneNumber,
      });
      if (user) {
        throw new HttpException('User already exists', HttpStatus.CONFLICT);
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async findLogin(createAuthDto: CreateAuthDto) {
    try {
      const user = await this.findByEmail(createAuthDto.email);
      
      const passwordMatched = await bcrypt.compare(
        createAuthDto.password,
        user.password,
      );

      if (!passwordMatched) {
        throw new HttpException(
          'Email or password incorrect',
          HttpStatus.NOT_FOUND,
        );
      }
      const sanitizedUser = sanitizeUser(user);
      // Inclure isFirstLogin dans la réponse pour que le frontend puisse gérer le changement de mot de passe
      return { ...sanitizedUser, isFirstLogin: user.isFirstLogin };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  /**
   * Change le mot de passe de l'utilisateur et met à jour isFirstLogin
   */
  async changePassword(userId: string, newPassword: string): Promise<any> {
    try {
      logger.info(`---USER.SERVICE.CHANGE_PASSWORD INIT--- userId=${userId}`);
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Mettre à jour le mot de passe (sera hashé automatiquement par le hook pre('save'))
      user.password = newPassword;
      // Mettre à jour isFirstLogin à false
      user.isFirstLogin = false;
      await user.save();

      // Populate le level après la sauvegarde
      await user.populate({
        path: 'level',
        select: 'name description',
      });

      logger.info(
        `---USER.SERVICE.CHANGE_PASSWORD SUCCESS--- userId=${userId}`,
      );
      return sanitizeUser(user);
    } catch (error) {
      logger.error(`---USER.SERVICE.CHANGE_PASSWORD ERROR--- ${error.message}`);
      throw new HttpException(
        error.message || 'Erreur lors du changement de mot de passe',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    files?: Express.Multer.File[],
  ) {
    try {
      logger.info(`---USER.SERVICE.UPDATE INIT---`);

      // Traiter l'upload de la photo de profil si présente
      let profilePhotoUrl: string | undefined;
      let cvUrl: string | undefined;
      let presentationVideoUrl: string | undefined;
      const profilePhotoFile = files?.find(
        (file) =>
          file.fieldname === 'profilePhoto' || file.fieldname === 'photo',
      );
      const cvFile = files?.find((file) => file.fieldname === 'cv');
      const presentationVideoFile = files?.find(
        (file) =>
          file.fieldname === 'videoPresentation' ||
          file.fieldname === 'presentationVideo' ||
          file.fieldname === 'video',
      );
      if (profilePhotoFile) {
        try {
          profilePhotoUrl = await uploadFile(profilePhotoFile);
          logger.info(
            `---USER.SERVICE.UPLOAD_PROFILE_PHOTO SUCCESS--- url=${profilePhotoUrl}`,
          );
        } catch (uploadError) {
          logger.error(
            `---USER.SERVICE.UPLOAD_PROFILE_PHOTO ERROR--- ${uploadError.message}`,
          );
          throw new HttpException(
            `Erreur lors de l'upload de la photo de profil: ${uploadError.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }
      if (cvFile) {
        try {
          cvUrl = await uploadFile(cvFile);
          logger.info(`---USER.SERVICE.UPLOAD_CV SUCCESS--- url=${cvUrl}`);
        } catch (uploadError) {
          logger.error(`---USER.SERVICE.UPLOAD_CV ERROR--- ${uploadError.message}`);
          throw new HttpException(
            `Erreur lors de l'upload du CV: ${uploadError.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }
      if (presentationVideoFile) {
        try {
          presentationVideoUrl = await uploadFile(presentationVideoFile);
          logger.info(
            `---USER.SERVICE.UPLOAD_PRESENTATION_VIDEO SUCCESS--- url=${presentationVideoUrl}`,
          );
        } catch (uploadError) {
          logger.error(
            `---USER.SERVICE.UPLOAD_PRESENTATION_VIDEO ERROR--- ${uploadError.message}`,
          );
          throw new HttpException(
            `Erreur lors de l'upload de la video de presentation: ${uploadError.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      const updateData: any = { ...updateUserDto, updated_at: new Date() };
      if (profilePhotoUrl) {
        updateData.profilePhoto = profilePhotoUrl;
      }
      if (cvUrl) {
        updateData.cv = cvUrl;
      }
      if (presentationVideoUrl) {
        updateData.videoPresentation = presentationVideoUrl;
      }

      const updated = await this.userModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .select('-password')
        .populate({
          path: 'lab',
          select: 'structure name type',
          populate: [{ path: 'structure', select: 'name' }],
        })
        .populate('environment')
        .populate({
          path: 'environmentPosition',
          populate: { path: 'position' },
        })
        .populate('contractType')
        .populate({
          path: 'level',
          select: 'name description',
        })
        .populate({
          path: 'specialities',
          select: 'name description',
        })
        .lean();
      if (!updated) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---USER.SERVICE.UPDATE SUCCESS---`);
      // Sanitizer le user (supprimer password, etc.)
      const sanitized = sanitizeUser(updated);
      return sanitized;
    } catch (error) {
      logger.error(`---USER.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---USER.SERVICE.REMOVE INIT---`);
      // Soft delete - désactiver l'utilisateur au lieu de le supprimer
      const deleted = await this.userModel
        .findByIdAndUpdate(
          id,
          { active: false, updated_at: new Date() },
          { new: true },
        )
        .select('-password')
        .exec();
      if (!deleted) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---USER.SERVICE.REMOVE SUCCESS---`);
      return sanitizeUser(deleted);
    } catch (error) {
      logger.error(`---USER.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  isSuperAdminOrLabAdmin(user: User, labId: string) {
    return (
      user.role == Role.SuperAdmin ||
      (user.role == Role.LabAdmin &&
        (String(user.lab?._id) || String(user.lab)) == labId)
    );
  }

  /**
   * Vérifie si un utilisateur peut gérer le personnel d'un labo
   */
  canManageLabPersonnel(requester: User, targetLabId: string): boolean {
    // SuperAdmin peut tout faire
    if (requester.role === Role.SuperAdmin) {
      return true;
    }

    // LabAdmin peut gérer uniquement son propre labo
    if (requester.role === Role.LabAdmin) {
      const requesterLabId = String(requester.lab?._id || requester.lab);
      return requesterLabId === String(targetLabId);
    }

    return false;
  }

  /**
   * Vérifie si un utilisateur peut voir les informations d'un autre utilisateur
   */
  canViewUser(requester: User, targetUser: User): boolean {
    // SuperAdmin peut tout voir
    if (requester.role === Role.SuperAdmin) {
      return true;
    }

    // LabAdmin peut voir les utilisateurs de son labo
    if (requester.role === Role.LabAdmin) {
      const requesterLabId = String(requester.lab?._id || requester.lab);
      const targetLabId = String(targetUser.lab?._id || targetUser.lab);
      return requesterLabId === targetLabId;
    }

    // LabStaff peut voir uniquement ses propres infos et les infos de son labo (mais pas modifier)
    if (requester.role === Role.LabStaff) {
      // Peut voir ses propres infos
      if (String(requester._id) === String(targetUser._id)) {
        return true;
      }
      // Peut voir les autres membres de son labo (lecture seule)
      const requesterLabId = String(requester.lab?._id || requester.lab);
      const targetLabId = String(targetUser.lab?._id || targetUser.lab);
      return requesterLabId === targetLabId;
    }

    return false;
  }

  /**
   * Récupère le personnel d'un labo avec filtres selon les permissions
   */
  async findLabPersonnel(
    labId: string,
    requester: User,
    query: {
      page?: number;
      limit?: number;
      firstname?: string;
      lastname?: string;
      bloodGroup?: string;
      email?: string;
    },
  ): Promise<any> {
    try {
      // Vérifier les permissions
      if (!this.canManageLabPersonnel(requester, labId)) {
        // Si LabStaff, vérifier qu'il peut au moins voir son labo
        if (requester.role === Role.LabStaff) {
          const requesterLabId = String(requester.lab?._id || requester.lab);
          if (requesterLabId !== String(labId)) {
            throw new HttpException(
              "Vous n'avez pas le droit de consulter ce laboratoire",
              HttpStatus.FORBIDDEN,
            );
          }
        } else {
          throw new HttpException(
            "Vous n'avez pas le droit de consulter ce laboratoire",
            HttpStatus.FORBIDDEN,
          );
        }
      }

      const {
        page = 1,
        limit = 10,
        firstname,
        lastname,
        bloodGroup,
        email,
      } = query;

      const filters: any = {
        lab: labId,
        active: true,
      };

      if (firstname) filters.firstname = { $regex: firstname, $options: 'i' };
      if (lastname) filters.lastname = { $regex: lastname, $options: 'i' };
      if (bloodGroup)
        filters.bloodGroup = { $regex: `^${bloodGroup}$`, $options: 'i' };
      if (email) filters.email = { $regex: email, $options: 'i' };

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.userModel
          .find(filters)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 })
          .select('-password')
          .populate({
            path: 'lab',
            select: 'structure',
            populate: [{ path: 'structure', select: 'name' }],
          })
          .lean(),
        this.userModel.countDocuments(filters),
      ]);

      return {
        data,
        limit,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async exportFile(userId: string): Promise<any> {
    try {
      logger.info(`---USER.SERVICE.EXPORT_FILE INIT--- userId=${userId}`);

      // Récupérer les informations de l'utilisateur
      const user = await this.userModel
        .findById(userId)
        .populate('lab', 'name')
        .populate('environment', 'name code')
        .populate({
          path: 'environmentPosition',
          select: 'title',
          populate: [{ path: 'environment', select: 'name' }],
        })
        .populate('level', 'name description')
        .populate('specialities', 'name description')
        .populate('region', 'name code')
        .lean();

      if (!user) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      // Sanitizer les données utilisateur
      const information = sanitizeUser(user);

      // Récupérer les expériences professionnelles
      const experiences = await this.professionalExperienceModel
        .find({ user: userId })
        .sort({ startDate: -1 })
        .lean();

      // Récupérer les formations
      const trainings = await this.trainingModel
        .find({ user: userId })
        .sort({ startDate: -1 })
        .lean();

      logger.info(`---USER.SERVICE.EXPORT_FILE SUCCESS--- userId=${userId}`);
      return {
        information,
        experiences,
        trainings,
      };
    } catch (error) {
      logger.error(`---USER.SERVICE.EXPORT_FILE ERROR--- ${error.message}`);
      throw new HttpException(
        error.message || "Erreur lors de l'export des données",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
