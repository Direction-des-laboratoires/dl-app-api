import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sdr } from './interfaces/sdr.interface';
import { CreateSdrDto } from './dto/create-sdr.dto';
import { UpdateSdrDto } from './dto/update-sdr.dto';
import { FindSdrDto } from './dto/find-sdr.dto';
import { UserService } from '../user/user.service';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';

@Injectable()
export class SdrService {
  constructor(
    @InjectModel('Sdr') private sdrModel: Model<Sdr>,
    private readonly userService: UserService,
  ) {}

  async create(createSdrDto: CreateSdrDto): Promise<Sdr> {
    try {
      logger.info(`---SDR.SERVICE.CREATE INIT---`);

      // Vérifier si une SDR avec le même numéro d'enregistrement existe
      if (createSdrDto.registrationNumber) {
        const existing = await this.sdrModel.findOne({
          registrationNumber: createSdrDto.registrationNumber,
        });
        if (existing) {
          throw new HttpException(
            "Une SDR avec ce numéro d'enregistrement existe déjà",
            HttpStatus.CONFLICT,
          );
        }
      }

      // Vérifier si l'email est déjà utilisé pour un utilisateur
      if (createSdrDto.email) {
        try {
          await this.userService.findByEmail(createSdrDto.email);
          throw new HttpException(
            'Cet email est déjà utilisé par un utilisateur',
            HttpStatus.CONFLICT,
          );
        } catch (error) {
          if (error.status !== HttpStatus.NOT_FOUND) {
            throw error;
          }
        }
      } else {
        throw new HttpException(
          "L'email est obligatoire pour créer une SDR et son compte administrateur",
          HttpStatus.BAD_REQUEST,
        );
      }

      // Créer l'utilisateur associé
      let user;
      try {
        user = await this.userService.create({
          firstname: createSdrDto.adminFirstname,
          lastname: createSdrDto.adminLastname,
          email: createSdrDto.email,
          role: Role.SdrAdmin,
        } as any);
        logger.info(
          `---SDR.SERVICE.CREATE USER SUCCESS--- email=${createSdrDto.email}`,
        );
      } catch (userError) {
        throw new HttpException(
          `Erreur lors de la création du compte administrateur: ${userError.message}`,
          userError.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Créer la SDR avec l'ID de l'admin
      const sdr = new this.sdrModel({
        ...createSdrDto,
        admin: user._id,
      });

      try {
        await sdr.save();
      } catch (sdrError) {
        // Si la création de la SDR échoue, on supprime l'utilisateur pour rester cohérent
        await this.userService.remove(user._id);
        throw new HttpException(
          `Erreur lors de la création de la SDR: ${sdrError.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      logger.info(`---SDR.SERVICE.CREATE SUCCESS---`);
      return sdr;
    } catch (error) {
      logger.error(`---SDR.SERVICE.CREATE ERROR--- ${error.message}`);
      throw new HttpException(
        error.message || 'Erreur lors de la création de la SDR',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindSdrDto): Promise<any> {
    try {
      logger.info(`---SDR.SERVICE.FIND_ALL INIT---`);

      const { page = 1, limit = 10, name, city, search, active } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};

      // Recherche globale
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { registrationNumber: { $regex: search, $options: 'i' } },
        ];
      } else {
        if (name) filters.name = { $regex: name, $options: 'i' };
        if (city) filters.city = { $regex: city, $options: 'i' };
      }

      if (active !== undefined) filters.active = active;

      const [data, total] = await Promise.all([
        this.sdrModel
          .find(filters)
          .populate('admin', 'firstname lastname phoneNumber email')
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 })
          .lean(),
        this.sdrModel.countDocuments(filters),
      ]);

      logger.info(`---SDR.SERVICE.FIND_ALL SUCCESS---`);
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error(`---SDR.SERVICE.FIND_ALL ERROR--- ${error.message}`);
      throw new HttpException(
        error.message || 'Erreur lors de la récupération des SDR',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<Sdr> {
    try {
      logger.info(`---SDR.SERVICE.FIND_ONE INIT--- id=${id}`);

      const sdr = await this.sdrModel
        .findById(id)
        .populate('admin', 'firstname lastname email')
        .lean();
      if (!sdr) {
        throw new HttpException('SDR non trouvée', HttpStatus.NOT_FOUND);
      }

      logger.info(`---SDR.SERVICE.FIND_ONE SUCCESS--- id=${id}`);
      return sdr as unknown as Sdr;
    } catch (error) {
      logger.error(`---SDR.SERVICE.FIND_ONE ERROR--- ${error.message}`);
      throw new HttpException(
        error.message || 'Erreur lors de la récupération de la SDR',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateSdrDto: UpdateSdrDto): Promise<Sdr> {
    try {
      logger.info(`---SDR.SERVICE.UPDATE INIT--- id=${id}`);

      // Vérifier si une autre SDR avec le même numéro d'enregistrement existe
      if (updateSdrDto.registrationNumber) {
        const existing = await this.sdrModel.findOne({
          registrationNumber: updateSdrDto.registrationNumber,
          _id: { $ne: id },
        });
        if (existing) {
          throw new HttpException(
            "Une autre SDR avec ce numéro d'enregistrement existe déjà",
            HttpStatus.CONFLICT,
          );
        }
      }

      const updated = await this.sdrModel
        .findByIdAndUpdate(
          id,
          { ...updateSdrDto, updated_at: new Date() },
          { new: true },
        )
        .lean();

      if (!updated) {
        throw new HttpException('SDR non trouvée', HttpStatus.NOT_FOUND);
      }

      logger.info(`---SDR.SERVICE.UPDATE SUCCESS--- id=${id}`);
      return updated as unknown as Sdr;
    } catch (error) {
      logger.error(`---SDR.SERVICE.UPDATE ERROR--- ${error.message}`);
      throw new HttpException(
        error.message || 'Erreur lors de la mise à jour de la SDR',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<Sdr> {
    try {
      logger.info(`---SDR.SERVICE.REMOVE INIT--- id=${id}`);

      // Soft delete - désactiver la SDR au lieu de la supprimer
      const deleted = await this.sdrModel
        .findByIdAndUpdate(
          id,
          { active: false, updated_at: new Date() },
          { new: true },
        )
        .lean();

      if (!deleted) {
        throw new HttpException('SDR non trouvée', HttpStatus.NOT_FOUND);
      }

      logger.info(`---SDR.SERVICE.REMOVE SUCCESS--- id=${id}`);
      return deleted as unknown as Sdr;
    } catch (error) {
      logger.error(`---SDR.SERVICE.REMOVE ERROR--- ${error.message}`);
      throw new HttpException(
        error.message || 'Erreur lors de la suppression de la SDR',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
