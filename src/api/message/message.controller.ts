import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Res,
  HttpStatus,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UploadHelper } from 'src/utils/functions/upload-image.helper';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * Créer et envoyer un message (mail ou SMS)
   * Seul le SuperAdmin peut envoyer des messages
   */
  @Post()
  @Roles(Role.SuperAdmin)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({ destination: UploadHelper.uploadDirectory }),
    }),
  )
  async create(
    @Body() createMessageDto: CreateMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---MESSAGE.CONTROLLER.CREATE INIT---`);
      const sentBy = req.user._id || req.user.userId || req.user.id;
      const message = await this.messageService.create(
        createMessageDto,
        sentBy,
        files || [],
      );
      logger.info(`---MESSAGE.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Message créé et envoyé avec succès',
        data: message,
      });
    } catch (error) {
      logger.error(`---MESSAGE.CONTROLLER.CREATE ERROR--- ${error.message}`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response || { message: error.message });
    }
  }

  /**
   * Récupérer la liste des messages avec filtres et pagination
   * Seul le SuperAdmin peut voir les messages
   */
  @Get()
  @Roles(Role.SuperAdmin)
  async findAll(@Query() query: any, @Res() res) {
    try {
      logger.info(`---MESSAGE.CONTROLLER.FIND_ALL INIT---`);
      const result = await this.messageService.findAll(query);
      logger.info(`---MESSAGE.CONTROLLER.FIND_ALL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des messages',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      logger.error(`---MESSAGE.CONTROLLER.FIND_ALL ERROR--- ${error.message}`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response || { message: error.message });
    }
  }

  /**
   * Récupérer un message par son ID
   * Seul le SuperAdmin peut voir les messages
   */
  @Get(':id')
  @Roles(Role.SuperAdmin)
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      logger.info(`---MESSAGE.CONTROLLER.FIND_ONE INIT--- id=${id}`);
      const message = await this.messageService.findOne(id);
      logger.info(`---MESSAGE.CONTROLLER.FIND_ONE SUCCESS--- id=${id}`);
      return res.status(HttpStatus.OK).json({
        message: 'Message récupéré avec succès',
        data: message,
      });
    } catch (error) {
      logger.error(`---MESSAGE.CONTROLLER.FIND_ONE ERROR--- ${error.message}`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response || { message: error.message });
    }
  }
}
