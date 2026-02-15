/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import logger from 'src/utils/logger';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ConfigService } from '@nestjs/config';
import { sanitizeUser } from 'src/utils/functions/sanitizer';
import { MessageSentFor } from 'src/utils/enums/message_sent_for.enum';
import { MessageTypes } from 'src/utils/enums/message_types.enum';
import { PhoneVerificationDto } from './dto/phone-verification.dto';
import { expirationDate } from 'src/utils/functions/expiration_date';
import { generateDigits } from 'src/utils/functions/code_generation';
import { SendCodeVerificationDto } from './dto/send-code-verification.dto';
import * as bcrypt from 'bcrypt';
import { PromobileSmsService } from 'src/providers/sms-service/promobile.service';
import { CreateLabAdminAccountDto } from './dto/create-lab-admin-account.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private configService: ConfigService,
    // private phoneMessageService: PhoneMessageService,
    private promobileSmsService: PromobileSmsService,
  ) {}
  async generateToken(user: any) {
    try {
      const payload = { email: user.email, role: user.role, userId: user._id };
      return this.jwtService.sign(payload, {
        secret: this.configService.get<string>('privateKey'),
        expiresIn: '1d',
      });
    } catch (error) {
      logger.error(`---GENERATE TOKEN ERROR ${error}`);
      throw new HttpException(error.message, error.status);
    }
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('privateKey'),
      });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async login(createAuthDto: CreateAuthDto) {
    try {
      logger.info(`---AUTH.SERVICE.LOGIN INIT---`);
      const user = await this.userService.findLogin(createAuthDto);      
      const token = await this.generateToken(user);
      logger.info(`---AUTH.SERVICE.LOGIN SUCCESS---`);
      return {
        user: user,
        token,
        isFirstLogin: user.isFirstLogin || true, // Inclure isFirstLogin dans la réponse
      };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  /**
   * Change le mot de passe lors de la première connexion
   */
  async changePasswordOnFirstLogin(
    userId: string,
    newPassword: string,
  ): Promise<any> {
    try {
      logger.info(
        `---AUTH.SERVICE.CHANGE_PASSWORD_FIRST_LOGIN INIT--- userId=${userId}`,
      );
      const updatedUser = await this.userService.changePassword(
        userId,
        newPassword,
      );
      const token = await this.generateToken(updatedUser);
      logger.info(`---AUTH.SERVICE.CHANGE_PASSWORD_FIRST_LOGIN SUCCESS---`);
      return {
        user: updatedUser,
        token,
        message: 'Mot de passe changé avec succès',
      };
    } catch (error) {
      logger.error(
        `---AUTH.SERVICE.CHANGE_PASSWORD_FIRST_LOGIN ERROR--- ${error.message}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  /**
   * Modifier le mot de passe (pour utilisateur connecté)
   */
  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<any> {
    try {
      logger.info(`---AUTH.SERVICE.UPDATE_PASSWORD INIT--- userId=${userId}`);

      // Récupérer l'utilisateur
      const user = await this.userService.findOne(userId);
      if (!user) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      // Vérifier le mot de passe actuel
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        throw new HttpException(
          'Mot de passe actuel incorrect',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Vérifier que le nouveau mot de passe est différent
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new HttpException(
          "Le nouveau mot de passe doit être différent de l'ancien",
          HttpStatus.BAD_REQUEST,
        );
      }

      // Mettre à jour le mot de passe
      const updatedUser = await this.userService.changePassword(
        userId,
        newPassword,
      );

      logger.info(
        `---AUTH.SERVICE.UPDATE_PASSWORD SUCCESS--- userId=${userId}`,
      );
      return {
        message: 'Mot de passe modifié avec succès',
        user: updatedUser,
      };
    } catch (error) {
      logger.error(`---AUTH.SERVICE.UPDATE_PASSWORD ERROR--- ${error.message}`);
      throw new HttpException(
        error.message || 'Erreur lors de la modification du mot de passe',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async register(createUserDto: CreateUserDto): Promise<any> {
    try {
      logger.info(`---AUTH.SERVICE.REGISTER INIT---`);
      const user = await this.userService.create(createUserDto);
      const token = await this.generateToken(user);
      logger.info(`---AUTH.SERVICE.REGISTER SUCCESS---`);
      return {
        message: 'Utilisateur créé avec succés!',
        data: { ...user, token },
      };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async registerLabAdmin(createLabAdminDto: CreateLabAdminAccountDto): Promise<any> {
    try {
      logger.info(`---AUTH.SERVICE.REGISTER_LAB_ADMIN INIT---`);
      const user = await this.userService.createLabAdminAccount(
        createLabAdminDto as any,
      );
      // const token = await this.generateToken(user);
      logger.info(`---AUTH.SERVICE.REGISTER_LAB_ADMIN SUCCESS---`);
      return {
        message: 'Compte LabAdmin créé avec succés!',
        // data: { ...user, token },
      };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async findByPhoneNumber(phoneNumber: string) {
    try {
      const user = await this.userService.findByPhoneNumber(phoneNumber);
      return user;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async findByEmail(email: string) {
    try {
      const user = await this.userService.findByEmail(email);
      return user;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async loginByPhoneNumber(phoneNumber: string) {
    try {
      const user = await this.findByPhoneNumber(phoneNumber);
      // const phoneMessageDto = new CreatePhoneMessageDto(
      //   MessageTypes.sms,
      //   MessageSentFor.phoneNumberVerification,
      //   expirationDate(5),
      //   Date.now(),
      // );
      // const phoneMessage = await this.phoneMessageService.create(
      //   phoneMessageDto,
      //   phoneNumber,
      // );

      // await this.promobileSmsService.sendSms({
      //   from: 'Fasili',
      //   to: phoneNumber,
      //   content: `Code de vérification: ${phoneMessage.code}`,
      // });
      return { phoneNumber };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async sendCodeVerificationToUnknownNumber(phoneNumber: string) {
    try {
      const user = await this.userService.checkPhoneNumber(phoneNumber);
      const code = generateDigits(6);
      const expiration = expirationDate(5);
      let phoneMessageDto = new SendCodeVerificationDto();
      phoneMessageDto.phoneNumber = phoneNumber;
      this.promobileSmsService.sendSms({
        from: 'Fasili',
        to: phoneNumber,
        content: `Code de vérification: ${code}`,
      });
      // return await this.phoneMessageService.createForUnknownNumber(
      //   phoneNumber,
      //   code,
      //   expiration,
      // );
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
