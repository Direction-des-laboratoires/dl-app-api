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
  HttpException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UserService } from './user.service';
import { CreateLabStaffDto, CreateUserDto } from './dto/create-user.dto';
import { CreateMultipleUsersDto } from './dto/create-multiple-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import logger from 'src/utils/logger';
import { Roles } from 'src/utils/decorators/role.decorator';
import { Role } from 'src/utils/enums/roles.enum';
import { FindUsersDto } from './dto/find-user.dto';
import { UploadHelper } from 'src/utils/functions/upload-image.helper';
import { CreateLabAdminAccountDto } from '../auth/dto/create-lab-admin-account.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({ destination: UploadHelper.uploadDirectory }),
    }),
  )
  @Post('register-lab-admin')
  async registerLabAdmin(
    @Body() createLabAdminDto: CreateLabAdminAccountDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Res() res,
  ) {
    try {
      logger.info(`---USER.CONTROLLER.REGISTER_LAB_ADMIN INIT---`);
      const user = await this.userService.createLabAdminAccount(
        createLabAdminDto as any,
        files || [],
      );
      logger.info(`---USER.CONTROLLER.REGISTER_LAB_ADMIN SUCCESS---`);
      return res.status(HttpStatus.CREATED).json({
        message: 'Compte LabAdmin créé avec succés!',
        data: user,
      });
    } catch (error) {
      logger.error(`---USER.CONTROLLER.REGISTER_LAB_ADMIN ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.LabAdmin, Role.SuperAdmin)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({ destination: UploadHelper.uploadDirectory }),
    }),
  )
  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---USER.CONTROLLER.CREATE INIT---`);

      // Si c'est un LabAdmin, on force son labo et le rôle LabStaff
      if (req.user.role === Role.LabAdmin) {
        const labId = req.user.lab?._id?.toString() || req.user.lab?.toString();
        if (!labId) {
          throw new HttpException(
            "Vous n'avez pas de laboratoire associé",
            HttpStatus.FORBIDDEN,
          );
        }
        createUserDto.lab = labId;
        createUserDto.role = Role.LabStaff;
      }

      const user = await this.userService.create(createUserDto, files || []);
      logger.info(`---USER.CONTROLLER.CREATE SUCCESS---`);
      return res.status(HttpStatus.CREATED).json(user);
    } catch (error) {
      logger.error(`---USER.CONTROLLER.CREATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.LabAdmin, Role.SuperAdmin)
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({ destination: UploadHelper.uploadDirectory }),
    }),
  )
  @Post('create-lab-staff')
  async createLabStaff(
    @Body() createUserDto: CreateLabStaffDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
    @Res() res,
  ) {
    try {
      // Forcer le labo du LabAdmin
      if (req.user.role === Role.LabAdmin) {
        createUserDto.lab = req.user.lab?._id.toString();
      }
      logger.info(`---USER.CONTROLLER.CREATE_LAB_STAFF INIT---`);
      const user = await this.userService.create(createUserDto, files || []);
      logger.info(`---USER.CONTROLLER.CREATE_LAB_STAFF SUCCESS---`);
      return res.status(HttpStatus.CREATED).json(user);
    } catch (error) {
      logger.error(`---USER.CONTROLLER.CREATE_LAB_STAFF ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Post('bulk')
  async createMultiple(
    @Body() createMultipleUsersDto: CreateMultipleUsersDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---USER.CONTROLLER.CREATE_MULTIPLE INIT---`);

      // Si c'est un LabAdmin, on force son labo pour tous les utilisateurs et le rôle LabStaff
      if (req.user.role === Role.LabAdmin) {
        const labId = req.user.lab?._id?.toString() || req.user.lab?.toString();
        if (!labId) {
          throw new HttpException(
            "Vous n'avez pas de laboratoire associé",
            HttpStatus.FORBIDDEN,
          );
        }
        createMultipleUsersDto.users = createMultipleUsersDto.users.map(
          (user) => ({
            ...user,
            lab: labId,
            role: Role.LabStaff,
          }),
        );
      }

      const result = await this.userService.createMultiple(
        createMultipleUsersDto.users,
      );
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      logger.error(`---USER.CONTROLLER.CREATE_MULTIPLE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.RegionAdmin)
  @Get('stats')
  async getStats(
    @Query('region') region: string,
    @Query('district') district: string,
    @Query('lab') lab: string,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---USER.CONTROLLER.GET_STATS INIT---`);
      const requester = req.user;

      // Appliquer les restrictions selon le rôle
      let finalRegion = region;
      let finalLab = lab;

      if (requester.role === Role.RegionAdmin) {
        finalRegion =
          requester.region?._id?.toString() || requester.region?.toString();
      } else if (requester.role === Role.LabAdmin) {
        finalLab = requester.lab?._id?.toString() || requester.lab?.toString();
      }

      const stats = await this.userService.getStats({
        region: finalRegion,
        district,
        lab: finalLab,
      });

      return res.status(HttpStatus.OK).json({
        message: 'Statistiques du personnel récupérées',
        data: stats,
      });
    } catch (error) {
      logger.error(`---USER.CONTROLLER.GET_STATS ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.LabStaff, Role.RegionAdmin)
  @Get()
  async findAll(@Query() query: FindUsersDto, @Req() req, @Res() res) {
    try {
      const requester = req.user;

      // LabStaff ne peut voir que les utilisateurs de son labo
      if (requester.role === Role.LabStaff) {
        if (requester.lab) {
          query.lab = requester.lab.toString();
        } else {
          throw new HttpException(
            "Vous n'avez pas de laboratoire associé",
            HttpStatus.FORBIDDEN,
          );
        }
      }
      // LabAdmin ne peut voir que les utilisateurs de son labo
      else if (requester.role === Role.LabAdmin) {
        if (requester.lab) {
          query.lab = requester.lab._id.toString();
        } else {
          throw new HttpException(
            "Vous n'avez pas de laboratoire associé",
            HttpStatus.FORBIDDEN,
          );
        }
      }
      // SuperAdmin peut voir tous les utilisateurs (pas de filtre)

      const result = await this.userService.findAll(query);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des utilisateurs',
        data: result.data,
        pagination: {
          total: result.total,
          page: parseInt(result.page),
          limit: parseInt(result.limit),
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        message: error.message || 'Erreur serveur',
      });
    }
  }

  @Roles(Role.SuperAdmin, Role.LabAdmin)
  @Get('sdrs')
  async findSDRs(@Query() query: FindUsersDto, @Req() req, @Res() res) {
    try {
      logger.info(`---USER.CONTROLLER.FIND_SDRS INIT---`);
      const result = await this.userService.findSDRs(query);
      return res.status(HttpStatus.OK).json({
        message: 'Liste des SDRs',
        data: result.data,
        pagination: {
          total: result.total,
          page: parseInt(result.page as any),
          limit: parseInt(result.limit as any),
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      logger.error(`---USER.CONTROLLER.FIND_SDRS ERROR ${error}---`);
      return res.status(error.status || 500).json({
        message: error.message || 'Erreur serveur',
      });
    }
  }

  /**
   * Récupère le personnel d'un laboratoire spécifique
   * Doit être défini avant @Get(':userId') pour éviter les conflits de routes
   */
  @Roles(Role.SuperAdmin, Role.LabAdmin, Role.LabStaff)
  @Get('lab/:labId/personnel')
  async getLabPersonnel(
    @Param('labId') labId: string,
    @Query() query: FindUsersDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(
        `---USER.CONTROLLER.GET_LAB_PERSONNEL INIT--- labId=${labId}`,
      );
      const requester = req.user;
      const result = await this.userService.findLabPersonnel(
        labId,
        requester,
        query,
      );
      logger.info(`---USER.CONTROLLER.GET_LAB_PERSONNEL SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Personnel du laboratoire ${labId}`,
        data: result.data,
        pagination: {
          total: result.total,
          page: parseInt(result.page),
          limit: parseInt(result.limit),
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      logger.error(`---USER.CONTROLLER.GET_LAB_PERSONNEL ERROR ${error}---`);
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message || 'Erreur serveur',
      });
    }
  }

  /**
   * Doit être défini avant @Get(':userId') pour éviter les conflits de routes
   */
  @Get('export-file/:userId')
  async exportFile(@Param('userId') userId: string, @Res() res) {
    try {
      logger.info(`---USER.CONTROLLER.EXPORT_FILE INIT--- userId=${userId}`);
      const data = await this.userService.exportFile(userId);
      logger.info(`---USER.CONTROLLER.EXPORT_FILE SUCCESS--- userId=${userId}`);
      return res.status(HttpStatus.OK).json({
        message: 'Données exportées avec succès',
        data,
      });
    } catch (error) {
      logger.error(`---USER.CONTROLLER.EXPORT_FILE ERROR--- ${error.message}`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response || { message: error.message });
    }
  }

  @Get(':userId')
  async findOne(@Param('userId') userId: string, @Req() req, @Res() res) {
    try {
      logger.info(`---USER.CONTROLLER.FIND_ONE INIT---`);
      const requester = req.user;
      const targetUser = await this.userService.findOne(userId);

      // Vérifier les permissions de visualisation
      if (!this.userService.canViewUser(requester, targetUser)) {
        throw new HttpException(
          "Vous n'avez pas le droit de consulter cet utilisateur!",
          HttpStatus.FORBIDDEN,
        );
      }

      logger.info(`---USER.CONTROLLER.FIND_ONE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Utilisateur ${userId}`,
        data: targetUser,
      });
    } catch (error) {
      logger.error(`---USER.CONTROLLER.FIND_ONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({ destination: UploadHelper.uploadDirectory }),
    }),
  )
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---USER.CONTROLLER.UPDATE INIT---`);
      const requester = req.user;
      const targetUser = await this.userService.findOne(id);

      // LabStaff ne peut modifier que ses propres infos
      if (requester.role === Role.LabStaff) {
        if (String(requester._id) !== String(targetUser._id)) {
          throw new HttpException(
            'Vous ne pouvez modifier que vos propres informations',
            HttpStatus.FORBIDDEN,
          );
        }
      }
      // LabAdmin peut modifier uniquement les utilisateurs de son labo
      else if (requester.role === Role.LabAdmin) {
        if (
          !this.userService.canManageLabPersonnel(
            requester,
            targetUser.lab?._id || targetUser.lab,
          )
        ) {
          throw new HttpException(
            "Vous n'avez pas le droit de modifier cet utilisateur",
            HttpStatus.FORBIDDEN,
          );
        }
      }
      // SuperAdmin peut modifier tous les utilisateurs
      const updated = await this.userService.update(
        id,
        updateUserDto,
        files || [],
      );
      logger.info(`---USER.CONTROLLER.UPDATE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Utilisateur ${id} mis à jour`,
        data: updated,
      });
    } catch (error) {
      logger.error(`---USER.CONTROLLER.UPDATE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req, @Res() res) {
    try {
      logger.info(`---USER.CONTROLLER.REMOVE INIT---`);
      const requester = req.user;
      const targetUser = await this.userService.findOne(id);

      // LabStaff ne peut pas supprimer
      if (requester.role === Role.LabStaff) {
        throw new HttpException(
          "Vous n'avez pas le droit de supprimer des utilisateurs",
          HttpStatus.FORBIDDEN,
        );
      }
      // LabAdmin peut supprimer uniquement les utilisateurs de son labo
      else if (requester.role === Role.LabAdmin) {
        if (
          !this.userService.canManageLabPersonnel(
            requester,
            targetUser.lab?._id || targetUser.lab,
          )
        ) {
          throw new HttpException(
            "Vous n'avez pas le droit de supprimer cet utilisateur",
            HttpStatus.FORBIDDEN,
          );
        }
      }
      // SuperAdmin peut supprimer tous les utilisateurs

      const deleted = await this.userService.remove(id);
      logger.info(`---USER.CONTROLLER.REMOVE SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: `Utilisateur ${id} supprimé`,
        data: deleted,
      });
    } catch (error) {
      logger.error(`---USER.CONTROLLER.REMOVE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
