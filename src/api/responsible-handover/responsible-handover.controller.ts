import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ResponsibleHandoverService } from './responsible-handover.service';
import { CreateHandoverDto } from './dto/create-handover.dto';
import { ReplaceResponsibleDto } from './dto/replace-responsible.dto';
import { FindHandoverDto } from './dto/find-handover.dto';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';

@Controller('responsible-handovers')
export class ResponsibleHandoverController {
  constructor(private readonly handoverService: ResponsibleHandoverService) {}

  // --- Public (sans token) : vérification + signalement ---

  @Get('verify/:userId')
  async verify(@Param('userId') userId: string, @Res() res) {
    try {
      const data = await this.handoverService.verifyResponsible(userId);
      return res.status(HttpStatus.OK).json({
        message: 'Responsable vérifié',
        data,
      });
    } catch (error: any) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Post('verify/:userId')
  async submit(
    @Param('userId') userId: string,
    @Body() dto: CreateHandoverDto,
    @Res() res,
  ) {
    try {
      logger.info(`---RESPONSIBLE_HANDOVER.CONTROLLER.SUBMIT INIT---`);
      const handover = await this.handoverService.createHandover(userId, dto);
      logger.info(`---RESPONSIBLE_HANDOVER.CONTROLLER.SUBMIT SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Merci, votre réponse a bien été enregistrée',
        data: handover,
      });
    } catch (error: any) {
      logger.error(
        `---RESPONSIBLE_HANDOVER.CONTROLLER.SUBMIT ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  // --- Protégé (back-office) : liste, détail, remplacement ---

  @Roles(Role.SuperAdmin, Role.RegionAdmin)
  @Get()
  async findAll(@Query() query: FindHandoverDto, @Res() res) {
    try {
      const result = await this.handoverService.findAll(query);
      const response: any = {
        message: 'Liste des changements de responsable',
        data: result.data,
      };
      if (query.paginate !== false) {
        response.pagination = {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        };
      }
      return res.status(HttpStatus.OK).json(response);
    } catch (error: any) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message || 'Erreur serveur' });
    }
  }

  @Roles(Role.SuperAdmin, Role.RegionAdmin)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      const handover = await this.handoverService.findOne(id);
      return res.status(HttpStatus.OK).json({
        message: 'Signalement récupéré',
        data: handover,
      });
    } catch (error: any) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message || 'Erreur serveur' });
    }
  }

  @Roles(Role.SuperAdmin, Role.RegionAdmin)
  @Post(':id/replace')
  async replace(
    @Param('id') id: string,
    @Body() dto: ReplaceResponsibleDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---RESPONSIBLE_HANDOVER.CONTROLLER.REPLACE INIT---`);
      const adminUserId = req.user?._id?.toString();
      const result = await this.handoverService.replace(id, dto, adminUserId);
      logger.info(`---RESPONSIBLE_HANDOVER.CONTROLLER.REPLACE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Responsable remplacé avec succès',
        data: result,
      });
    } catch (error: any) {
      logger.error(
        `---RESPONSIBLE_HANDOVER.CONTROLLER.REPLACE ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
