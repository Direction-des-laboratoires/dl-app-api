import { HttpException, Injectable, HttpStatus } from '@nestjs/common';
import { CreateStructureLevelDto } from './dto/create-structure-level.dto';
import { UpdateStructureLevelDto } from './dto/update-structure-level.dto';
import { InjectModel } from '@nestjs/mongoose';
import { StructureLevel } from './interfaces/structure-level.interface';
import { Model } from 'mongoose';
import structureLevels from '../../utils/seeds/structure-level.json'
import logger from 'src/utils/logger';

@Injectable()
export class StructureLevelService {
  constructor(@InjectModel('StructureLevel') private structureLevelModel:Model<StructureLevel>){}
  
  async create(createStructureLevelDto: CreateStructureLevelDto) {
    try {
      logger.info(`---STRUCTURE_LEVEL.SERVICE.CREATE INIT---`);
      const structureLevel = await this.structureLevelModel.create(createStructureLevelDto);
      logger.info(`---STRUCTURE_LEVEL.SERVICE.CREATE SUCCESS---`);
      return structureLevel;
    } catch (error) {
      logger.error(`---STRUCTURE_LEVEL.SERVICE.CREATE ERROR ${error}---`);
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createMany(){
    try {
      logger.info(`---STRUCTURE_LEVEL.SERVICE.CREATE_MANY INIT---`);
      const structureLevelSeeds = await this.structureLevelModel.insertMany(structureLevels);
      logger.info(`---STRUCTURE_LEVEL.SERVICE.CREATE_MANY SUCCESS---`);
      return structureLevelSeeds;
    } catch (error) {
      logger.error(`---STRUCTURE_LEVEL.SERVICE.CREATE_MANY ERROR ${error}---`);
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(query?: { status?: string }) {
    try {
      logger.info(`---STRUCTURE_LEVEL.SERVICE.FIND_ALL INIT---`);
      const filters: any = {};
      if (query?.status) {
        filters.status = query.status;
      }
      const structureLevels = await this.structureLevelModel.find(filters).sort({ name: 1 }).exec();
      logger.info(`---STRUCTURE_LEVEL.SERVICE.FIND_ALL SUCCESS---`);
      return structureLevels;
    } catch (error) {
      logger.error(`---STRUCTURE_LEVEL.SERVICE.FIND_ALL ERROR ${error}---`);
      throw new HttpException(error.message || 'Erreur serveur', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: string) {
    try {
      logger.info(`---STRUCTURE_LEVEL.SERVICE.FIND_ONE INIT---`);
      const structureLevel = await this.structureLevelModel.findById(id).exec();
      if (!structureLevel) {
        throw new HttpException('Niveau de structure non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---STRUCTURE_LEVEL.SERVICE.FIND_ONE SUCCESS---`);
      return structureLevel;
    } catch (error) {
      logger.error(`---STRUCTURE_LEVEL.SERVICE.FIND_ONE ERROR ${error}---`);
      throw new HttpException(error.message || 'Erreur serveur', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: string, updateStructureLevelDto: UpdateStructureLevelDto) {
    try {
      logger.info(`---STRUCTURE_LEVEL.SERVICE.UPDATE INIT---`);
      const updated = await this.structureLevelModel.findByIdAndUpdate(
        id,
        { ...updateStructureLevelDto, updated_at: new Date() },
        { new: true }
      ).exec();
      if (!updated) {
        throw new HttpException('Niveau de structure non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---STRUCTURE_LEVEL.SERVICE.UPDATE SUCCESS---`);
      return updated;
    } catch (error) {
      logger.error(`---STRUCTURE_LEVEL.SERVICE.UPDATE ERROR ${error}---`);
      throw new HttpException(error.message || 'Erreur serveur', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(id: string) {
    try {
      logger.info(`---STRUCTURE_LEVEL.SERVICE.REMOVE INIT---`);
      const deleted = await this.structureLevelModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        throw new HttpException('Niveau de structure non trouvé', HttpStatus.NOT_FOUND);
      }
      logger.info(`---STRUCTURE_LEVEL.SERVICE.REMOVE SUCCESS---`);
      return deleted;
    } catch (error) {
      logger.error(`---STRUCTURE_LEVEL.SERVICE.REMOVE ERROR ${error}---`);
      throw new HttpException(error.message || 'Erreur serveur', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
