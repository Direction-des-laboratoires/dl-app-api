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
import { IntrantStocksService } from './intrant-stocks.service';
import { CreateIntrantStockDto } from './dto/create-intrant-stock.dto';
import { UpdateIntrantStockDto } from './dto/update-intrant-stock.dto';
import { FindIntrantStockDto } from './dto/find-intrant-stock.dto';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';

@Controller('intrant-stocks')
export class IntrantStocksController {
  constructor(private readonly intrantStocksService: IntrantStocksService) {}

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Post()
  async create(
    @Body() createIntrantStockDto: CreateIntrantStockDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      const stock = await this.intrantStocksService.create(
        createIntrantStockDto,
        req.user,
      );
      return res.status(HttpStatus.CREATED).json({
        message: 'Stock créé avec succès',
        data: stock,
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Get()
  async findAll(@Query() query: FindIntrantStockDto, @Res() res) {
    try {
      const result = await this.intrantStocksService.findAll(query);
      return res.status(HttpStatus.OK).json({
        ...result,
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      const stock = await this.intrantStocksService.findOne(id);
      return res.status(HttpStatus.OK).json({
        data: stock,
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateIntrantStockDto: UpdateIntrantStockDto, @Res() res) {
    try {
      const stock = await this.intrantStocksService.update(id, updateIntrantStockDto);
      return res.status(HttpStatus.OK).json({
        message: 'Stock mis à jour avec succès',
        data: stock,
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      const deleted = await this.intrantStocksService.remove(id);
      return res.status(HttpStatus.OK).json({
        message: 'Stock supprimé avec succès',
        data: deleted,
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
}
