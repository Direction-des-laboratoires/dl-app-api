/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import logger from 'src/utils/logger';
import { CreateAuthDto } from './dto/create-auth.dto';
import { PhoneNumberAuthDto } from './dto/phone-number-auth.dto';
import { PhoneVerificationDto } from './dto/phone-verification.dto';
import { SendCodeVerificationDto } from './dto/send-code-verification.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { RequestOtpDto } from '../otp/dto/request-otp.dto';
import { VerifyOtpDto } from '../otp/dto/verify-otp.dto';
import { ResetPasswordDto } from '../otp/dto/reset-password.dto';
import { OtpService } from '../otp/otp.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto, @Res() res) {
    try {
      logger.info(`---AUTH.CONTROLLER.REGISTER INIT---`);
      const user = await this.authService.register(createUserDto);
      logger.info(`---AUTH.CONTROLLER.REGISTER SUCCESS---`);
      return res.status(HttpStatus.CREATED).json(user);
    } catch (error) {
      logger.error(`---AUTH.CONTROLLER.REGISTER ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Post('login')
  async login(@Body() createAuthDto: CreateAuthDto, @Res() res) {
    try {
      logger.info(`---AUTH.CONTROLLER.LOGIN INIT---`);
      const user = await this.authService.login(createAuthDto);
      logger.info(`---AUTH.CONTROLLER.LOGIN SUCCESS---`);
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Connecté !', data: user });
    } catch (error) {
      logger.error(`---AUTH.CONTROLLER.LOGIN ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Get('me')
  async me(@Req() req, @Res() res) {
    try {
      logger.info(`---AUTH.CONTROLLER.ME INIT---`);
      const email = req.user.email;
      const user = await this.authService.findByEmail(email);
      logger.info(`---AUTH.CONTROLLER.ME SUCCESS---`);
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Connecté !', data: user });
    } catch (error) {
      logger.error(`---AUTH.CONTROLLER.ME ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Post('loginByPhoneNumber')
  async loginByPhoneNumber(
    @Body() phoneNumberAuth: PhoneNumberAuthDto,
    @Res() res,
  ) {
    try {
      logger.info(`---AUTH.CONTROLLER.LOGIN_BY_PHONE_NUMBER INIT---`);
      const user = await this.authService.loginByPhoneNumber(
        phoneNumberAuth.phoneNumber,
      );
      logger.info(`---AUTH.CONTROLLER.LOGIN_BY_PHONE_NUMBER SUCCESS---`);
      return res.status(HttpStatus.OK).json(user);
    } catch (error) {
      logger.error(
        `---AUTH.CONTROLLER.LOGIN_BY_PHONE_NUMBER ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Post('phoneVerification')
  async phoneVerification(
    @Body() phoneVerificationDto: PhoneVerificationDto,
    @Res() res,
  ) {
    try {
      logger.info(`---AUTH.CONTROLLER.VERIFY_PHONE INIT---`);
      // const phoneMessage = await this.phoneMessageService.verifyPhone(
      //   phoneVerificationDto,
      // );
      //const token = await this.authService.generateToken(phoneMessage.userId);
      logger.info(`---AUTH.CONTROLLER.VERIFY_PHONE SUCCESS---`);
      //return res.status(HttpStatus.OK).json(phoneMessage);
    } catch (error) {
      logger.error(`---AUTH.CONTROLLER.VERIFY_PHONE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Post('sendCodeToUnknownPhoneNumber')
  async sendVerificationCode(
    @Body() codeVerificationDto: SendCodeVerificationDto,
    @Res() res,
  ) {
    try {
      logger.info(`---AUTH.CONTROLLER.SEND_PHONE_CODE INIT---`);
      const phoneMessage =
        await this.authService.sendCodeVerificationToUnknownNumber(
          codeVerificationDto.phoneNumber,
        );
      logger.info(`---AUTH.CONTROLLER.SEND_PHONE_CODE SUCCESS---`);
      return res.status(HttpStatus.OK).json(phoneMessage);
    } catch (error) {
      logger.error(`---AUTH.CONTROLLER.SEND_PHONE_CODE ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  @Post('change-password-first-login')
  async changePasswordFirstLogin(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---AUTH.CONTROLLER.CHANGE_PASSWORD_FIRST_LOGIN INIT---`);
      // Récupérer userId depuis req.user (peut être _id ou userId selon le format)
      const userId = req.user._id || req.user.userId || req.user.id;
      if (!userId) {
        throw new HttpException(
          'User ID not found in token',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const result = await this.authService.changePasswordOnFirstLogin(
        userId,
        changePasswordDto.newPassword,
      );
      logger.info(`---AUTH.CONTROLLER.CHANGE_PASSWORD_FIRST_LOGIN SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result,
      });
    } catch (error) {
      logger.error(
        `---AUTH.CONTROLLER.CHANGE_PASSWORD_FIRST_LOGIN ERROR ${error}---`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  /**
   * Modifier le mot de passe (pour utilisateur connecté)
   */
  @Post('update-password')
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() req,
    @Res() res,
  ) {
    try {
      logger.info(`---AUTH.CONTROLLER.UPDATE_PASSWORD INIT---`);
      const userId = req.user._id || req.user.userId || req.user.id;
      if (!userId) {
        throw new HttpException(
          'User ID not found in token',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const result = await this.authService.updatePassword(
        userId,
        updatePasswordDto.currentPassword,
        updatePasswordDto.newPassword,
      );
      logger.info(`---AUTH.CONTROLLER.UPDATE_PASSWORD SUCCESS---`);
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result,
      });
    } catch (error) {
      logger.error(`---AUTH.CONTROLLER.UPDATE_PASSWORD ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  /**
   * Demander un code OTP pour réinitialiser le mot de passe
   */
  @Post('forgot-password')
  async forgotPassword(@Body() requestOtpDto: RequestOtpDto, @Res() res) {
    try {
      logger.info(`---AUTH.CONTROLLER.FORGOT_PASSWORD INIT---`);
      const result = await this.otpService.requestOtp(requestOtpDto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      logger.error(`---AUTH.CONTROLLER.FORGOT_PASSWORD ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  /**
   * Vérifier le code OTP
   */
  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Res() res) {
    try {
      logger.info(`---AUTH.CONTROLLER.VERIFY_OTP INIT---`);
      const result = await this.otpService.verifyOtp(verifyOtpDto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      logger.error(`---AUTH.CONTROLLER.VERIFY_OTP ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  /**
   * Réinitialiser le mot de passe avec le code OTP
   */
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Res() res) {
    try {
      logger.info(`---AUTH.CONTROLLER.RESET_PASSWORD INIT---`);
      const result = await this.otpService.resetPassword(resetPasswordDto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      logger.error(`---AUTH.CONTROLLER.RESET_PASSWORD ERROR ${error}---`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
