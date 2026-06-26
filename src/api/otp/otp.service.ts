import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp } from './interfaces/otp.interface';
import { OtpTypeEnum } from './schemas/otp.schema';
import { User } from '../user/interfaces/user.interface';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from 'src/providers/mail-service/mail.service';
import { MailTemplates } from 'src/providers/mail-service/mail.templates';
import { generateDigits } from 'src/utils/functions/code_generation';
import { AuthService } from '../auth/auth.service';
import {
  expirationDate,
  isCodeExpired,
} from 'src/utils/functions/expiration_date';
import logger from 'src/utils/logger';

import { forwardRef, Inject } from '@nestjs/common';

@Injectable()
export class OtpService {
  constructor(
    @InjectModel('Otp') private otpModel: Model<Otp>,
    @InjectModel('User') private userModel: Model<User>,
    private mailService: MailService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}

  /**
   * Génère et envoie un code OTP par email
   */
  async requestOtp(requestOtpDto: RequestOtpDto): Promise<any> {
    try {
      logger.info(
        `---OTP.SERVICE.REQUEST_OTP INIT--- email=${requestOtpDto.email}`,
      );

      // Vérifier si l'utilisateur existe
      const user = await this.userModel
        .findOne({ email: requestOtpDto.email })
        .lean();
      if (!user) {
        // Ne pas révéler que l'utilisateur n'existe pas pour des raisons de sécurité
        logger.warn(
          `---OTP.SERVICE.REQUEST_OTP USER_NOT_FOUND--- email=${requestOtpDto.email}`,
        );
        return {
          success: true,
          message: 'Si cet email existe, un code de vérification a été envoyé',
        };
      }

      // Générer un code OTP de 6 chiffres
      const code = generateDigits(6).toString();
      const expiration = expirationDate(5); // Code valide pendant 5 minutes (mis à jour)

      // Marquer les anciens codes OTP du même type comme utilisés
      await this.otpModel.updateMany(
        {
          user: user._id,
          type: requestOtpDto.type,
          used: false,
        },
        {
          used: true,
          usedAt: new Date(),
        },
      );

      // Créer le nouveau code OTP
      await this.otpModel.create({
        user: user._id,
        code,
        type: requestOtpDto.type,
        expirationDate: expiration,
        used: false,
      });

      // Envoyer le code par email
      if (requestOtpDto.type === OtpTypeEnum.PASSWORD_RESET) {
        const html = MailTemplates.passwordResetOtp(
          code,
          user.firstname || 'Utilisateur',
        );
        await this.mailService.sendMail({
          to: requestOtpDto.email,
          subject: 'Code de réinitialisation de mot de passe',
          html,
        });
      }

      logger.info(
        `---OTP.SERVICE.REQUEST_OTP SUCCESS--- email=${requestOtpDto.email}`,
      );
      return {
        success: true,
        message: 'Un code de vérification a été envoyé à votre adresse email',
        expirationMinutes: 5,
      };
    } catch (error) {
      logger.error(`---OTP.SERVICE.REQUEST_OTP ERROR--- ${error.message}`);
      throw new HttpException(
        error.message || 'Erreur lors de la génération du code OTP',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Vérifie un code OTP
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<any> {
    try {
      logger.info(
        `---OTP.SERVICE.VERIFY_OTP INIT--- email=${verifyOtpDto.email}`,
      );

      // Trouver l'utilisateur
      const user = await this.userModel
        .findOne({ email: verifyOtpDto.email })
        .lean();
      if (!user) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      // Trouver le code OTP valide
      const otp = await this.otpModel
        .findOne({
          user: user._id,
          code: verifyOtpDto.code,
          type: verifyOtpDto.type,
          used: false,
        })
        .lean();

      if (!otp) {
        throw new HttpException(
          'Code OTP invalide ou déjà utilisé',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Vérifier l'expiration
      if (isCodeExpired(otp.expirationDate)) {
        throw new HttpException('Code OTP expiré', HttpStatus.BAD_REQUEST);
      }

      logger.info(
        `---OTP.SERVICE.VERIFY_OTP SUCCESS--- email=${verifyOtpDto.email}`,
      );

      // Générer un token temporaire pour la réinitialisation
      const token = await this.authService.generateToken(user);

      return {
        success: true,
        message: 'Code OTP valide',
        valid: true,
        token, // Retourner le token spécifique à l'utilisateur
      };
    } catch (error) {
      logger.error(`---OTP.SERVICE.VERIFY_OTP ERROR--- ${error.message}`);
      throw new HttpException(
        error.message || 'Erreur lors de la vérification du code OTP',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Réinitialise le mot de passe avec un token validé
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any> {
    try {
      logger.info(`---OTP.SERVICE.RESET_PASSWORD INIT---`);

      // Vérifier et décoder le token
      const decoded = await this.authService.verifyToken(resetPasswordDto.token);
      if (!decoded || !decoded.userId) {
        throw new HttpException('Token invalide ou expiré', HttpStatus.UNAUTHORIZED);
      }

      // Trouver l'utilisateur
      const user = await this.userModel.findById(decoded.userId);
      if (!user) {
        throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
      }

      
      // Mettre à jour le mot de passe de l'utilisateur
      user.password = resetPasswordDto.newPassword;
      user.isFirstLogin = false;
      await user.save();

      logger.info(
        `---OTP.SERVICE.RESET_PASSWORD SUCCESS--- userId=${user._id}`,
      );
      return {
        success: true,
        message: 'Mot de passe réinitialisé avec succès',
      };
    } catch (error) {
      logger.error(`---OTP.SERVICE.RESET_PASSWORD ERROR--- ${error.message}`);
      throw new HttpException(
        error.message || 'Erreur lors de la réinitialisation du mot de passe',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
