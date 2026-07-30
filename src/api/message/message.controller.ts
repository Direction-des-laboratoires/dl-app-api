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
import {
  CreateMessageDto,
  SendRegionAccessesDto,
  SendUserAccessesDto,
} from './dto/create-message.dto';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';
import logger from 'src/utils/logger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UploadHelper } from 'src/utils/functions/upload-image.helper';
import { ACCESS_RESULT_NOTIFICATION_EMAILS } from './constants/region-access-mail.constants';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('region-accesses')
  @Roles(Role.SuperAdmin)
  async sendRegionAccesses(
    @Body() sendRegionAccessesDto: SendRegionAccessesDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---MESSAGE.CONTROLLER.SEND_REGION_ACCESSES INIT---`);
      const sentBy = req.user._id || req.user.userId || req.user.id;
      const result = this.messageService.sendRegionAccesses(
        sendRegionAccessesDto,
        sentBy,
      );
      logger.info(`---MESSAGE.CONTROLLER.SEND_REGION_ACCESSES ACCEPTED---`);
      return res.status(HttpStatus.ACCEPTED).json({
        message: result.message,
        accepted: true,
        notifyEmails: ACCESS_RESULT_NOTIFICATION_EMAILS,
      });
    } catch (error) {
      logger.error(
        `---MESSAGE.CONTROLLER.SEND_REGION_ACCESSES ERROR--- ${error.message}`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response || { message: error.message });
    }
  }

  @Post('user-accesses')
  @Roles(Role.SuperAdmin)
  async sendUserAccesses(
    @Body() sendUserAccessesDto: SendUserAccessesDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---MESSAGE.CONTROLLER.SEND_USER_ACCESSES INIT---`);
      const sentBy = req.user._id || req.user.userId || req.user.id;
      const result = this.messageService.sendUserAccesses(
        sendUserAccessesDto,
        sentBy,
      );
      logger.info(`---MESSAGE.CONTROLLER.SEND_USER_ACCESSES ACCEPTED---`);
      return res.status(HttpStatus.ACCEPTED).json({
        message: result.message,
        accepted: true,
        notifyEmails: ACCESS_RESULT_NOTIFICATION_EMAILS,
      });
    } catch (error) {
      logger.error(
        `---MESSAGE.CONTROLLER.SEND_USER_ACCESSES ERROR--- ${error.message}`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response || { message: error.message });
    }
  }

  /**
   * Endpoint de test : envoie un SMS via Orange SMS Pro.
   * Public (aucun rôle requis) — à retirer/protéger en production.
   *
   * Body : { "to": "221771234567" | ["221...","221..."], "content": "...", "subject"?: "..." }
   */
  @Post('test-sms')
  async testSms(
    @Body()
    body: { to: string | string[]; content: string; subject?: string },
    @Res() res,
  ) {
    try {
      logger.info(`---MESSAGE.CONTROLLER.TEST_SMS INIT---`);
      const result = await this.messageService.testSendSms(body);
      logger.info(`---MESSAGE.CONTROLLER.TEST_SMS SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: 'SMS de test envoyé',
        data: result,
      });
    } catch (error) {
      logger.error(`---MESSAGE.CONTROLLER.TEST_SMS ERROR--- ${error.message}`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response || { message: error.message });
    }
  }

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
