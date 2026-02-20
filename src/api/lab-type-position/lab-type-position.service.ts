import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import logger from 'src/utils/logger';
import { CreateLabTypePositionDto } from './dto/create-lab-type-position.dto';
import { FindLabTypePositionDto } from './dto/find-lab-type-position.dto';
import { UpdateLabTypePositionDto } from './dto/update-lab-type-position.dto';
import { LabTypePosition } from './interfaces/lab-type-position.interface';

@Injectable()
export class LabTypePositionService {
  constructor(
    @InjectModel('LabTypePosition')
    private labTypePositionModel: Model<LabTypePosition>,
  ) {}

  async create(createLabTypePositionDto: CreateLabTypePositionDto): Promise<any> {
    try {
      logger.info(`---LAB_TYPE_POSITION.SERVICE.CREATE INIT---`);
      const existing = await this.labTypePositionModel.findOne({
        labType: createLabTypePositionDto.labType,
        position: createLabTypePositionDto.position,
      });
      if (existing) {
        throw new HttpException(
          'Cette association existe déjà',
          HttpStatus.CONFLICT,
        );
      }
      const created = await this.labTypePositionModel.create(createLabTypePositionDto);
      await created.populate('labType', 'name code');
      await created.populate('position', 'title');
      logger.info(`---LAB_TYPE_POSITION.SERVICE.CREATE SUCCESS---`);
      return {
        message: 'Association labType-position créée avec succès',
        data: created,
      };
    } catch (error) {
      logger.error(`---LAB_TYPE_POSITION.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message || "Erreur lors de la création de l'association",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createBulk(labType: string, positions: string[]): Promise<any> {
    try {
      logger.info(
        `---LAB_TYPE_POSITION.SERVICE.CREATE_BULK INIT--- labType=${labType}, count=${positions.length}`,
      );
      const results = [];
      const errors = [];

      for (const position of positions) {
        try {
          const existing = await this.labTypePositionModel.findOne({
            labType,
            position,
          });
          if (existing) {
            errors.push({
              position,
              error: 'Cette association existe déjà',
            });
            continue;
          }
          const created = await this.labTypePositionModel.create({ labType, position });
          results.push(created);
        } catch (error) {
          errors.push({
            position,
            error: error.message,
          });
        }
      }

      logger.info(
        `---LAB_TYPE_POSITION.SERVICE.CREATE_BULK SUCCESS--- created=${results.length}, failed=${errors.length}`,
      );
      return {
        message: `${results.length} associations créées avec succès`,
        data: results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error(`---LAB_TYPE_POSITION.SERVICE.CREATE_BULK ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la création multiple des associations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindLabTypePositionDto): Promise<any> {
    try {
      logger.info(`---LAB_TYPE_POSITION.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, labType, position, active, search } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (labType) filters.labType = labType;
      if (position) filters.position = position;
      if (active !== undefined) filters.active = active;

      if (search) {
        const [matchingLabTypes, matchingPositions] = await Promise.all([
          this.labTypePositionModel.db
            .model('LabType')
            .find({
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
              ],
            })
            .select('_id'),
          this.labTypePositionModel.db
            .model('Position')
            .find({ title: { $regex: search, $options: 'i' } })
            .select('_id'),
        ]);

        filters.$or = [
          { labType: { $in: matchingLabTypes.map((item) => item._id) } },
          { position: { $in: matchingPositions.map((item) => item._id) } },
        ];
      }

      const [data, total] = await Promise.all([
        this.labTypePositionModel
          .find(filters)
          .populate('labType', 'name code description active')
          .populate('position', 'title')
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 })
          .lean(),
        this.labTypePositionModel.countDocuments(filters),
      ]);

      logger.info(`---LAB_TYPE_POSITION.SERVICE.FIND_ALL SUCCESS---`);
      return {
        message: 'Associations labType-position récupérées avec succès',
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`---LAB_TYPE_POSITION.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la récupération des associations',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<any> {
    const item = await this.labTypePositionModel
      .findById(id)
      .populate('labType', 'name code description active')
      .populate('position', 'title')
      .exec();
    if (!item) {
      throw new HttpException('Association non trouvée', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'Association récupérée avec succès',
      data: item,
    };
  }

  async update(id: string, updateLabTypePositionDto: UpdateLabTypePositionDto): Promise<any> {
    const updated = await this.labTypePositionModel
      .findByIdAndUpdate(
        id,
        { ...updateLabTypePositionDto, updated_at: new Date() },
        { new: true },
      )
      .populate('labType', 'name code description active')
      .populate('position', 'title')
      .exec();
    if (!updated) {
      throw new HttpException('Association non trouvée', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'Association mise à jour avec succès',
      data: updated,
    };
  }

  async remove(id: string): Promise<any> {
    const deleted = await this.labTypePositionModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new HttpException('Association non trouvée', HttpStatus.NOT_FOUND);
    }
    return { message: 'Association supprimée avec succès' };
  }
}
