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
import { IntrantOrdersService } from './intrant-orders.service';
import { CreateIntrantOrderDto } from './dto/create-intrant-order.dto';
import { UpdateIntrantOrderDto } from './dto/update-intrant-order.dto';
import { FindIntrantOrderDto } from './dto/find-intrant-order.dto';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';

@Controller('intrant-orders')
export class IntrantOrdersController {
  constructor(private readonly intrantOrdersService: IntrantOrdersService) {}

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Post()
  async create(
    @Body() createIntrantOrderDto: CreateIntrantOrderDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      const order = await this.intrantOrdersService.create(
        createIntrantOrderDto,
        req.user,
      );
      return res.status(HttpStatus.CREATED).json({
        message: 'Commande créée avec succès',
        data: order,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindIntrantOrderDto, @Res() res) {
    try {
      const result = await this.intrantOrdersService.findAll(query);
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
      const order = await this.intrantOrdersService.findOne(id);
      return res.status(HttpStatus.OK).json({
        data: order,
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
    @Body() updateIntrantOrderDto: UpdateIntrantOrderDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      const order = await this.intrantOrdersService.update(
        id,
        updateIntrantOrderDto,
        req.user,
      );
      return res.status(HttpStatus.OK).json({
        message: 'Commande mise à jour avec succès',
        data: order,
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
      const deleted = await this.intrantOrdersService.remove(id);
      return res.status(HttpStatus.OK).json({
        message: 'Commande supprimée avec succès',
        data: deleted,
      });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}


