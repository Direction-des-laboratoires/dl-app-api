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
  Req,
} from '@nestjs/common';
import { IntrantUsagesService } from './intrant-usages.service';
import { CreateIntrantUsageDto } from './dto/create-intrant-usage.dto';
import { UpdateIntrantUsageDto } from './dto/update-intrant-usage.dto';
import { FindIntrantUsageDto } from './dto/find-intrant-usage.dto';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';

@Controller('intrant-usages')
export class IntrantUsagesController {
  constructor(private readonly intrantUsagesService: IntrantUsagesService) {}

  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.LabStaff)
  @Post()
  async create(
    @Body() createIntrantUsageDto: CreateIntrantUsageDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      const usage = await this.intrantUsagesService.create(
        createIntrantUsageDto,
        req.user,
      );
      return res.status(HttpStatus.CREATED).json({
        message: "Utilisation d'intrant enregistrée avec succès",
        data: usage,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindIntrantUsageDto, @Res() res) {
    try {
      const result = await this.intrantUsagesService.findAll(query);
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
      const usage = await this.intrantUsagesService.findOne(id);
      return res.status(HttpStatus.OK).json({
        data: usage,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateIntrantUsageDto: UpdateIntrantUsageDto,
    @Res() res,
  ) {
    try {
      const usage = await this.intrantUsagesService.update(
        id,
        updateIntrantUsageDto,
      );
      return res.status(HttpStatus.OK).json({
        message: "Utilisation d'intrant mise à jour avec succès",
        data: usage,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      const deleted = await this.intrantUsagesService.remove(id);
      return res.status(HttpStatus.OK).json({
        message: "Utilisation d'intrant supprimée avec succès",
        data: deleted,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
