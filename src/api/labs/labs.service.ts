import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { FindLabsDto } from './dto/find-lab.dto';
import { LabsStatsDto } from './dto/labs-stats.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lab } from './interfaces/labs.interface';
import { Structure } from 'src/api/structure/interfaces/structure.interface';
import logger from 'src/utils/logger';
import mongoose from 'mongoose';
import { sanitizeUserObject } from 'src/utils/functions/sanitizer';
import { Role } from 'src/utils/enums/roles.enum';
import { Gender } from 'src/utils/enums/gender.enum';
import { User } from '../user/interfaces/user.interface';
import { MailService } from 'src/providers/mail-service/mail.service';

@Injectable()
export class LabsService {
  constructor(
    @InjectModel('Lab') private labModel: Model<Lab>,
    @InjectModel('Structure') private structureModel: Model<Structure>,
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('StaffLevel') private staffLevelModel: Model<any>,
    private mailService: MailService,
  ) {}

  private normalizeValue(value: any): string | null {
    if (value === undefined || value === null) return null;
    const normalized = String(value).replace(/\u00A0/g, ' ').trim();
    return normalized === '' ? null : normalized;
  }

  private async createManagerForLab(manager: any, labId: string) {
    if (!manager) return null;

    const email = this.normalizeValue(manager.email);
    const phoneNumber = this.normalizeValue(manager.phoneNumber);
    const firstname = this.normalizeValue(manager.firstName);
    const lastname = this.normalizeValue(manager.lastName);

    if (!firstname || !lastname || !email) {
      return null;
    }

    const existingByEmailOrPhoneNumber = await this.userModel.findOne({ $or: [{ email }, { phoneNumber }] }).exec();
    if (existingByEmailOrPhoneNumber) {
      // await this.userModel
      //   .findByIdAndUpdate(existingByEmailOrPhoneNumber._id, { lab: labId })
      //   .exec();
      return existingByEmailOrPhoneNumber;
    }

    const defaultLevel = await this.staffLevelModel
      .findOne({rank: 2}).exec(); //Doctor level

    if (!defaultLevel?._id) {
      throw new HttpException(
        'Aucun niveau de personnel trouvé pour créer les responsables',
        HttpStatus.BAD_REQUEST,
      );
    }

    const plainPassword = Math.random().toString(36).slice(-10) + 'A1';

    const userData: any = {
      firstname,
      lastname,
      email,
      phoneNumber,
      role: manager.role || Role.LabAdmin,
      environment: this.normalizeValue(manager.environment),
      environmentPosition: this.normalizeValue(manager.position),
      nationality: 'Sénégalaise',
      entryDate: new Date(),
      lab: labId,
      level: defaultLevel._id,
      password: plainPassword,
    };

    const created = await this.userModel.create(userData);

    try {
      const fullName = `${firstname} ${lastname}`.trim();
      // await this.mailService.sendWelcomeEmail(
      //   email,
      //   fullName || 'Utilisateur',
      //   plainPassword,
      // );
    } catch (mailError) {
      logger.error(
        `---LABS.SERVICE.SEND_ACCESS_EMAIL ERROR--- ${mailError.message}`,
      );
      // Ne bloque pas la création si l'envoi email échoue
    }

    return created;
  }
  async create(createLabDto: CreateLabDto) {
    try {
      logger.info(`---LABS.SERVICE.CREATE INIT---`);

      // Parser latLng si présent et le séparer en lat et lng
      const labData: any = { ...createLabDto };
      if (createLabDto.latLng) {
        const [lat, lng] = createLabDto.latLng
          .split(',')
          .map((coord) => coord.trim());
        if (lat && lng) {
          labData.lat = lat;
          labData.lng = lng;
        } else {
          throw new HttpException(
            'Format latLng invalide. Format attendu: "lat,lng"',
            HttpStatus.BAD_REQUEST,
          );
        }
        // Supprimer latLng du data avant de sauvegarder
        delete labData.latLng;
      }

      const lab = await this.labModel.create(labData);
      logger.info(`---LABS.SERVICE.CREATE SUCCESS---`);
      return lab;
    } catch (error) {
      logger.error(`---LABS.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la création du laboratoire',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createMultiple(createLabsDto: CreateLabDto[]) {
    try {
      logger.info(
        `---LABS.SERVICE.CREATE_MULTIPLE INIT--- count=${createLabsDto.length}`,
      );

      const totalCount = createLabsDto.length;

      // Parser latLng pour chaque lab et le séparer en lat et lng
      const labsData = createLabsDto.map((labDto) => {
        const labData: any = { ...labDto };
        if (labDto.latLng) {
          const [lat, lng] = labDto.latLng
            .split(',')
            .map((coord) => coord.trim());
          if (lat && lng) {
            labData.lat = lat;
            labData.lng = lng;
          }
          // Supprimer latLng du data avant de sauvegarder
          delete labData.latLng;
        }
        return labData;
      });

      // Créer tous les labs en une seule opération
      const labs = await this.labModel.insertMany(labsData, {
        ordered: false, // Continue même si certains échouent
      });

      const successCount = labs.length;
      const failedCount = totalCount - successCount;

      logger.info(
        `---LABS.SERVICE.CREATE_MULTIPLE SUCCESS--- created=${successCount}, failed=${failedCount}`,
      );

      return {
        labs,
        successCount,
        failedCount,
        totalCount,
      };
    } catch (error: any) {
      logger.error(`---LABS.SERVICE.CREATE_MULTIPLE ERROR ${error}---`);

      // Si c'est une erreur de bulk write, extraire les détails
      if (error.writeErrors && error.writeErrors.length > 0) {
        const totalCount = createLabsDto.length;
        const successCount = error.insertedCount || 0;
        const failedCount = error.writeErrors.length;

        const errors = error.writeErrors.map((err: any) => ({
          index: err.index,
          code: err.code,
          message: err.errmsg || err.message,
        }));

        throw new HttpException(
          {
            message: 'Erreur lors de la création de certains laboratoires',
            errors,
            successCount,
            failedCount,
            totalCount,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        error.message || 'Erreur lors de la création des laboratoires',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createBulkWithManagers(payload: any[]): Promise<any> {
    try {
      logger.info(
        `---LABS.SERVICE.CREATE_BULK_WITH_MANAGERS INIT--- count=${payload.length}`,
      );
      const data = [];
      const errors = [];

      for (let i = 0; i < payload.length; i++) {
        const item = payload[i];
        try {
          const labData: CreateLabDto = {
            name: this.normalizeValue(item.name) as string,
            structure: this.normalizeValue(item.structure),
            latLng: this.normalizeValue(item.latLng),
            phoneNumber: this.normalizeValue(item.phoneNumber),
            email: this.normalizeValue(item.email),
            specialities: Array.isArray(item.specialities) ? item.specialities : [],
          };

          const createdLab = await this.create(labData);

          const director = await this.createManagerForLab(
            item.directorObject,
            String(createdLab._id),
          );
          const responsible = await this.createManagerForLab(
            item.responsibleObject,
            String(createdLab._id),
          );

          const updateLabData: any = {};
          if (director?._id) updateLabData.director = director._id;
          if (responsible?._id) updateLabData.responsible = responsible._id;

          let finalLab = createdLab;
          if (Object.keys(updateLabData).length > 0) {
            finalLab = await this.labModel
              .findByIdAndUpdate(createdLab._id, updateLabData, { new: true })
              .exec();
          }

          data.push({
            lab: finalLab,
            director: director || null,
            responsible: responsible || null,
          });
        } catch (error) {
          errors.push({
            index: i,
            name: item?.name || null,
            error: error.message,
          });
        }
      }

      return {
        message: `${data.length} laboratoire(s) créé(s) avec succès`,
        data,
        successCount: data.length,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error(
        `---LABS.SERVICE.CREATE_BULK_WITH_MANAGERS ERROR ${error}---`,
      );
      throw new HttpException(
        error.message || 'Erreur lors de la création bulk des laboratoires',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindLabsDto): Promise<any> {
    try {
      const {
        page = 1,
        limit = 10,
        paginate = true,
        structure,
        type,
        region,
        department,
        district,
        name,
        search,
        specialities,
      } = query;
      const shouldPaginate = paginate !== false;

      const skip = (page - 1) * limit;

      // Filtres directs sur LAB
      const labFilters: any = {};
      if (structure) labFilters.structure = structure;
      if (type) labFilters.type = type;
      if (name) labFilters.name = { $regex: name, $options: 'i' }; // recherche insensible à la casse

      if (search) {
        const structureIdsFromSearch = await this.structureModel
          .find({ name: { $regex: search, $options: 'i' } })
          .select('_id')
          .exec();

        labFilters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
          {
            structure: { $in: structureIdsFromSearch.map((s) => s._id) },
          },
        ];
      }

      if (specialities && specialities.length > 0) {
        // Filtrer les labs qui ont au moins une des spécialités fournies
        // Convertir les strings en ObjectId si nécessaire
        const specialityIds = specialities.map((id) => {
          if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
            return new mongoose.Types.ObjectId(id);
          }
          return id;
        });
        labFilters.specialities = { $in: specialityIds };
      }

      // Filtres sur STRUCTURE : récupérer d'abord les IDs des structures qui correspondent
      if (region || department || district) {
        const structureFilters: any = {};
        if (region) structureFilters.region = region;
        if (department) structureFilters.department = department;
        if (district) structureFilters.district = district;

        const matchingStructures = await this.structureModel
          .find(structureFilters)
          .select('_id')
          .exec();

        const structureIds = matchingStructures.map((s) => s._id);

        if (structureIds.length === 0) {
          // Aucune structure ne correspond, donc aucun lab ne correspondra
          if (!shouldPaginate) {
            return { data: [] };
          }
          return {
            data: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
          };
        }

        // Filtrer les labs par les IDs de structures
        if (labFilters.structure) {
          // Si un filtre structure existe déjà, on doit vérifier qu'il est dans la liste
          const structureIdStr = labFilters.structure.toString();
          const matchingStructureIds = structureIds.map((id) => id.toString());
          if (!matchingStructureIds.includes(structureIdStr)) {
            // Le structure spécifié ne correspond pas aux filtres region/department
            if (!shouldPaginate) {
              return { data: [] };
            }
            return {
              data: [],
              total: 0,
              page,
              limit,
              totalPages: 0,
            };
          }
          // Le structure est valide, on garde le filtre tel quel
        } else {
          labFilters.structure = { $in: structureIds };
        }
      }

      const labsQuery = this.labModel
        .find(labFilters)
        .populate({
          path: 'type',
          select: 'name code description active',
        })
        .populate({
          path: 'structure',
          populate: [{ path: 'region department district', select: 'name code' }],
        })
        .populate({
          path: 'specialities',
          select: 'name description',
        })
        .populate({
          path: 'director',
          select: 'email firstname lastname phoneNumber level specialities',
          populate: [
            { path: 'level', select: 'name description' },
            { path: 'specialities', select: 'name description' },
          ],
        })
        .populate({
          path: 'responsible',
          select: 'email firstname lastname phoneNumber level specialities',
          populate: [
            { path: 'level', select: 'name description' },
            { path: 'specialities', select: 'name description' },
          ],
        })
        .sort({ created_at: -1 });

      if (shouldPaginate) {
        labsQuery.skip(skip).limit(limit);
      }

      const [data, total] = await Promise.all([
        labsQuery.lean(),
        shouldPaginate ? this.labModel.countDocuments(labFilters) : Promise.resolve(0),
      ]);

      // Sanitizer les utilisateurs (director et responsible) dans les résultats
      const sanitizedData = data.map((lab: any) => {
        if (lab.director) {
          lab.director = sanitizeUserObject(lab.director);
        }
        if (lab.responsible) {
          lab.responsible = sanitizeUserObject(lab.responsible);
        }
        return lab;
      });

      if (!shouldPaginate) {
        return { data: sanitizedData };
      }

      return {
        data: sanitizedData,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || 500,
      );
    }
  }

  async findOne(id: string) {
    try {
      const lab = await this.labModel
        .findById(id)
        .populate({
          path: 'type',
          select: 'name code description active',
        })
        .populate({
          path: 'structure',
          populate: [
            { path: 'region', select: 'name code' },
            { path: 'department district', select: 'name' },
          ],
        })
        .populate({
          path: 'director',
          select: 'email firstname lastname phoneNumber level specialities',
          populate: [
            { path: 'level', select: 'name description' },
            { path: 'specialities', select: 'name description' },
          ],
        })
        .populate({
          path: 'responsible',
          select: 'email firstname lastname phoneNumber level specialities',
          populate: [
            { path: 'level', select: 'name description' },
            { path: 'specialities', select: 'name description' },
          ],
        })
        .lean();
      if (!lab) {
        throw new HttpException('Lab not found', HttpStatus.NOT_FOUND);
      }

      // Sanitizer les utilisateurs
      const sanitizedLab: any = { ...lab };
      if (sanitizedLab.director) {
        sanitizedLab.director = sanitizeUserObject(sanitizedLab.director);
      }
      if (sanitizedLab.responsible) {
        sanitizedLab.responsible = sanitizeUserObject(sanitizedLab.responsible);
      }

      return sanitizedLab;
    } catch (error) {
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || 500,
      );
    }
  }

  async update(id: string, updateLabDto: UpdateLabDto) {
    try {
      logger.info(`---LABS.SERVICE.UPDATE INIT---`);

      // Parser latLng si présent et le séparer en lat et lng
      const updateData: any = { ...updateLabDto, updated_at: new Date() };
      if (updateLabDto.latLng) {
        const [lat, lng] = updateLabDto.latLng
          .split(',')
          .map((coord) => coord.trim());
        if (lat && lng) {
          updateData.lat = lat;
          updateData.lng = lng;
        } else {
          throw new HttpException(
            'Format latLng invalide. Format attendu: "lat,lng"',
            HttpStatus.BAD_REQUEST,
          );
        }
        // Supprimer latLng du data avant de sauvegarder
        delete updateData.latLng;
      }

      const updated = await this.labModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('structure', 'name')
        .populate({
          path: 'director',
          select: 'email firstname lastname phoneNumber level specialities',
          populate: [
            { path: 'level', select: 'name description' },
            { path: 'specialities', select: 'name description' },
          ],
        })
        .populate({
          path: 'responsible',
          select: 'email firstname lastname phoneNumber level specialities',
          populate: [
            { path: 'level', select: 'name description' },
            { path: 'specialities', select: 'name description' },
          ],
        })
        .lean();
      if (!updated) {
        throw new HttpException('Laboratoire non trouvé', HttpStatus.NOT_FOUND);
      }

      // Sanitizer les utilisateurs
      const sanitizedUpdated: any = { ...updated };
      if (sanitizedUpdated.director) {
        sanitizedUpdated.director = sanitizeUserObject(
          sanitizedUpdated.director,
        );
      }
      if (sanitizedUpdated.responsible) {
        sanitizedUpdated.responsible = sanitizeUserObject(
          sanitizedUpdated.responsible,
        );
      }

      logger.info(`---LABS.SERVICE.UPDATE SUCCESS---`);
      return sanitizedUpdated;
    } catch (error) {
      logger.error(`---LABS.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---LABS.SERVICE.REMOVE INIT---`);
      const deleted = await this.labModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        throw new HttpException('Laboratoire non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---LABS.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(`---LABS.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur serveur',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async countLabsByRegion() {
    try {
      const result = await this.labModel.aggregate([
        // 1. Join avec Structure
        {
          $lookup: {
            from: 'structures',
            localField: 'structure',
            foreignField: '_id',
            as: 'structure',
          },
        },
        { $unwind: '$structure' },

        // 2. Join avec Region
        {
          $lookup: {
            from: 'regions',
            localField: 'structure.region',
            foreignField: '_id',
            as: 'region',
          },
        },
        { $unwind: '$region' },

        // 3. Groupement par région
        {
          $group: {
            _id: '$region._id',
            regionName: { $first: '$region.name' },
            regionCode: { $first: '$region.code' },
            totalLabs: { $sum: 1 },
          },
        },

        // 4. Format final propre
        {
          $project: {
            _id: 0,
            regionId: '$_id',
            regionName: 1,
            regionCode: 1,
            totalLabs: 1,
          },
        },

        // 5. Tri par nombre décroissant
        { $sort: { totalLabs: -1 } },
      ]);

      return result;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async findLabsByRegion(
    regionId: string,
    query: FindLabsDto,
  ): Promise<any> {
    try {
      return await this.findAll({ ...query, region: regionId });
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async getStats(query: LabsStatsDto): Promise<any> {
    try {
      const { pole, region, district, type } = query;
      const allLabTypes = await this.labModel.db
        .collection('labtypes')
        .find({}, { projection: { _id: 1, name: 1, code: 1 } })
        .toArray();
      const defaultLabsByType = allLabTypes.map((labType: any) => ({
        _id: labType._id,
        typeName: labType.name,
        typeCode: labType.code,
        total: 0,
      }));
      const defaultPersonnelByRole = Object.values(Role).map((role) => ({
        _id: role,
        total: 0,
      }));
      const defaultPersonnelByGender = Object.values(Gender).map((gender) => ({
        _id: gender,
        total: 0,
      }));

      const labFilters: any = {};
      if (type) {
        labFilters.type = new mongoose.Types.ObjectId(type);
      }

      // Résolution des structures selon filtres géographiques
      if (pole || region || district) {
        const structurePipeline: any[] = [];
        const structureMatch: any = {};

        if (region) structureMatch.region = new mongoose.Types.ObjectId(region);
        if (district) structureMatch.district = new mongoose.Types.ObjectId(district);

        if (Object.keys(structureMatch).length > 0) {
          structurePipeline.push({ $match: structureMatch });
        }

        if (pole) {
          structurePipeline.push(
            {
              $lookup: {
                from: 'regions',
                localField: 'region',
                foreignField: '_id',
                as: 'regionInfo',
              },
            },
            { $unwind: '$regionInfo' },
            {
              $match: {
                'regionInfo.pole': new mongoose.Types.ObjectId(pole),
              },
            },
          );
        }

        structurePipeline.push({ $project: { _id: 1 } });

        const matchingStructures =
          await this.structureModel.aggregate(structurePipeline);
        const structureIds = matchingStructures.map((s) => s._id);

        if (structureIds.length === 0) {
          return {
            filters: query,
            totalLabs: 0,
            totalPersonnel: 0,
            labsByType: defaultLabsByType,
            personnelByRole: defaultPersonnelByRole,
            personnelByGender: defaultPersonnelByGender,
          };
        }

        labFilters.structure = { $in: structureIds };
      }

      const labs = await this.labModel.find(labFilters).select('_id').lean();
      const labIds = labs.map((lab) => lab._id);
      const totalLabs = labIds.length;

      const labsByType = await this.labModel.aggregate([
        { $match: labFilters },
        {
          $lookup: {
            from: 'labtypes',
            localField: 'type',
            foreignField: '_id',
            as: 'typeInfo',
          },
        },
        {
          $unwind: {
            path: '$typeInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: '$typeInfo._id',
            typeName: { $first: '$typeInfo.name' },
            typeCode: { $first: '$typeInfo.code' },
            total: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]);
      const labsByTypeMap = new Map(
        labsByType.map((item) => [String(item._id || ''), item.total]),
      );
      const labsByTypeWithDefaults = defaultLabsByType.map((item) => ({
        ...item,
        total: labsByTypeMap.get(String(item._id)) ?? 0,
      }));
      const knownLabTypeIds = new Set(
        defaultLabsByType.map((item) => String(item._id)),
      );
      const labsByTypeExtras = labsByType
        .filter((item) => !knownLabTypeIds.has(String(item._id || '')))
        .map((item) => ({
          _id: item._id ?? null,
          typeName: item.typeName || 'Non defini',
          typeCode: item.typeCode || null,
          total: item.total || 0,
        }));
      const finalLabsByType = [...labsByTypeWithDefaults, ...labsByTypeExtras];

      if (labIds.length === 0) {
        return {
          filters: query,
          totalLabs,
          totalPersonnel: 0,
          labsByType: finalLabsByType,
          personnelByRole: defaultPersonnelByRole,
          personnelByGender: defaultPersonnelByGender,
        };
      }

      const personnelFilters = {
        lab: { $in: labIds },
        active: true,
      };

      const [totalPersonnel, personnelByRole, personnelByGender] = await Promise.all(
        [
          this.userModel.countDocuments(personnelFilters),
          this.userModel.aggregate([
            { $match: personnelFilters },
            { $group: { _id: '$role', total: { $sum: 1 } } },
            { $sort: { total: -1 } },
          ]),
          this.userModel.aggregate([
            { $match: personnelFilters },
            { $group: { _id: '$gender', total: { $sum: 1 } } },
            { $sort: { total: -1 } },
          ]),
        ],
      );
      const personnelByRoleMap = new Map(
        personnelByRole.map((item) => [String(item._id || ''), item.total]),
      );
      const personnelByGenderMap = new Map(
        personnelByGender.map((item) => [String(item._id || ''), item.total]),
      );
      const personnelByRoleWithDefaults = defaultPersonnelByRole.map((item) => ({
        ...item,
        total: personnelByRoleMap.get(item._id) ?? 0,
      }));
      const knownRoles = new Set<string>(
        defaultPersonnelByRole.map((item) => String(item._id)),
      );
      const personnelByRoleExtras = personnelByRole.filter(
        (item) => !knownRoles.has(String(item._id || '')),
      );
      const personnelByGenderWithDefaults = defaultPersonnelByGender.map(
        (item) => ({
          ...item,
          total: personnelByGenderMap.get(item._id) ?? 0,
        }),
      );
      const knownGenders = new Set<string>(
        defaultPersonnelByGender.map((item) => String(item._id)),
      );
      const personnelByGenderExtras = personnelByGender.filter(
        (item) => !knownGenders.has(String(item._id || '')),
      );

      return {
        filters: query,
        totalLabs,
        totalPersonnel,
        labsByType: finalLabsByType,
        personnelByRole: [...personnelByRoleWithDefaults, ...personnelByRoleExtras],
        personnelByGender: [
          ...personnelByGenderWithDefaults,
          ...personnelByGenderExtras,
        ],
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erreur lors de la récupération des statistiques',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
