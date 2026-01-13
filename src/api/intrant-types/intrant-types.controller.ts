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
import { IntrantTypesService } from './intrant-types.service';
import { CreateIntrantTypeDto } from './dto/create-intrant-type.dto';
import { UpdateIntrantTypeDto } from './dto/update-intrant-type.dto';
import { FindIntrantTypeDto } from './dto/find-intrant-type.dto';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';

@Controller('intrant-types')
export class IntrantTypesController {
  constructor(private readonly intrantTypesService: IntrantTypesService) {}

  @Roles(Role.SuperAdmin)
  @Post()
  async create(@Body() createIntrantTypeDto: CreateIntrantTypeDto, @Res() res) {
    try {
      logger.info(`---INTRANT_TYPES.CONTROLLER.CREATE INIT---`);
      const type = await this.intrantTypesService.create(createIntrantTypeDto);
      return res.status(HttpStatus.CREATED).json({
        message: 'Type créé avec succès',
        data: type,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindIntrantTypeDto, @Res() res) {
    try {
      const result = await this.intrantTypesService.findAll(query);
      return res.status(HttpStatus.OK).json({
        ...result,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      const type = await this.intrantTypesService.findOne(id);
      return res.status(HttpStatus.OK).json({
        data: type,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateIntrantTypeDto: UpdateIntrantTypeDto,
    @Res() res,
  ) {
    try {
      const type = await this.intrantTypesService.update(
        id,
        updateIntrantTypeDto,
      );
      return res.status(HttpStatus.OK).json({
        message: 'Type mis à jour avec succès',
        data: type,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      const deleted = await this.intrantTypesService.remove(id);
      return res.status(HttpStatus.OK).json({
        message: 'Type supprimé avec succès',
        data: deleted,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
