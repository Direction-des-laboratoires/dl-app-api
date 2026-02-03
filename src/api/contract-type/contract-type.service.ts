import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContractType } from './interfaces/contract-type.interface';
import { CreateContractTypeDto } from './dto/create-contract-type.dto';
import { UpdateContractTypeDto } from './dto/update-contract-type.dto';
import { FindContractTypeDto } from './dto/find-contract-type.dto';
import logger from 'src/utils/logger';

@Injectable()
export class ContractTypeService {
  constructor(
    @InjectModel('ContractType') private contractTypeModel: Model<ContractType>,
  ) {}

  async create(createContractTypeDto: CreateContractTypeDto): Promise<any> {
    try {
      logger.info(`---CONTRACT_TYPE.SERVICE.CREATE INIT---`);
      const existing = await this.contractTypeModel.findOne({ 
        $or: [
          { code: createContractTypeDto.code },
          { name: createContractTypeDto.name }
        ]
      });
      if (existing) {
        throw new HttpException('Un type de contrat avec ce nom ou ce code existe déjà', HttpStatus.CONFLICT);
      }
      const created = await this.contractTypeModel.create(createContractTypeDto);
      logger.info(`---CONTRACT_TYPE.SERVICE.CREATE SUCCESS---`);
      return {
        message: 'Type de contrat créé avec succès',
        data: created,
      };
    } catch (error) {
      logger.error(`---CONTRACT_TYPE.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(
        error.message || 'Erreur lors de la création du type de contrat',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(query: FindContractTypeDto): Promise<any> {
    try {
      logger.info(`---CONTRACT_TYPE.SERVICE.FIND_ALL INIT---`);
      const { page = 1, limit = 10, search, active } = query;
      const skip = (page - 1) * limit;

      const filters: any = {};
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ];
      }
      if (active !== undefined) {
        filters.active = active;
      }

      const [data, total] = await Promise.all([
        this.contractTypeModel
          .find(filters)
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.contractTypeModel.countDocuments(filters).exec(),
      ]);

      logger.info(`---CONTRACT_TYPE.SERVICE.FIND_ALL SUCCESS---`);
      return {
        message: 'Types de contrat récupérés avec succès',
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`---CONTRACT_TYPE.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(
        'Erreur lors de la récupération des types de contrat',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<any> {
    const contractType = await this.contractTypeModel.findById(id).exec();
    if (!contractType) {
      throw new HttpException('Type de contrat non trouvé', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'Type de contrat récupéré avec succès',
      data: contractType,
    };
  }

  async update(id: string, updateContractTypeDto: UpdateContractTypeDto): Promise<any> {
    const updated = await this.contractTypeModel.findByIdAndUpdate(
      id,
      { ...updateContractTypeDto, updated_at: new Date() },
      { new: true },
    ).exec();
    if (!updated) {
      throw new HttpException('Type de contrat non trouvé', HttpStatus.NOT_FOUND);
    }
    return {
      message: 'Type de contrat mis à jour avec succès',
      data: updated,
    };
  }

  async remove(id: string): Promise<any> {
    const deleted = await this.contractTypeModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new HttpException('Type de contrat non trouvé', HttpStatus.NOT_FOUND);
    }
    return { message: 'Type de contrat supprimé avec succès' };
  }
}
