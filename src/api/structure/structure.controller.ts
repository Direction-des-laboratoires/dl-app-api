import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { StructureService } from './structure.service';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';

@Controller('structures')
export class StructureController {
  constructor(private readonly structureService: StructureService) {}

  @Post()
  async create(@Body() createStructureDto: CreateStructureDto, @Res() res) {
    try {
      const structure = await this.structureService.create(createStructureDto);
      return res
        .status(HttpStatus.CREATED)
        .json({ message: 'Structure créée', data: structure });
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  }

  @Post('bulk')
  async createMultiple(@Body() structuresDto: CreateStructureDto[], @Res() res) {
    try {
      const result = await this.structureService.createMultiple(structuresDto);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(
    @Res() res,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('region') region?: string,
    @Query('department') department?: string,
    @Query('district') district?: string,
    @Query('level') level?: string,
    @Query('type') type?: string,
    @Query('name') name?: string,
  ) {
    try {
      const result = await this.structureService.findAll({
        page,
        limit,
        region,
        department,
        district,
        level,
        type,
        name,
      });

      return res.status(HttpStatus.OK).json({
        message: 'Liste des structures',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit,
        },
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message || 'Erreur serveur',
      });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      const structure = await this.structureService.findOne(id);
      return res
        .status(HttpStatus.OK)
        .json({ message: `Structure ${id} récupérée`, data: structure });
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStructureDto: UpdateStructureDto,
    @Res() res,
  ) {
    try {
      const updated = await this.structureService.update(
        id,
        updateStructureDto,
      );
      return res
        .status(HttpStatus.OK)
        .json({ message: `Structure ${id} mise à jour`, data: updated });
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      const deleted = await this.structureService.remove(id);
      return res
        .status(HttpStatus.OK)
        .json({ message: `Structure ${id} supprimée`, data: deleted });
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  }
}
