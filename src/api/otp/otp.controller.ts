import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { OtpService } from './otp.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import logger from 'src/utils/logger';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  /**
   * Demander un code OTP (mot de passe oublié)
   */
  @Post('request')
  async requestOtp(@Body() requestOtpDto: RequestOtpDto, @Res() res) {
    try {
      logger.info(
        `---OTP.CONTROLLER.REQUEST INIT--- email=${requestOtpDto.email}`,
      );
      const result = await this.otpService.requestOtp(requestOtpDto);
      logger.info(
        `---OTP.CONTROLLER.REQUEST SUCCESS--- email=${requestOtpDto.email}`,
      );
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result,
      });
    } catch (error) {
      logger.error(`---OTP.CONTROLLER.REQUEST ERROR--- ${error.message}`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response || { message: error.message });
    }
  }

  /**
   * Vérifier un code OTP
   */
  @Post('verify')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Res() res) {
    try {
      logger.info(
        `---OTP.CONTROLLER.VERIFY INIT--- email=${verifyOtpDto.email}`,
      );
      const result = await this.otpService.verifyOtp(verifyOtpDto);
      logger.info(
        `---OTP.CONTROLLER.VERIFY SUCCESS--- email=${verifyOtpDto.email}`,
      );
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result,
      });
    } catch (error) {
      logger.error(`---OTP.CONTROLLER.VERIFY ERROR--- ${error.message}`);
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response || { message: error.message });
    }
  }

  /**
   * Réinitialiser le mot de passe avec un code OTP
   */
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Res() res) {
    try {
      logger.info(
        `---OTP.CONTROLLER.RESET_PASSWORD INIT--- `,
      );
      const result = await this.otpService.resetPassword(resetPasswordDto);
      logger.info(
        `---OTP.CONTROLLER.RESET_PASSWORD SUCCESS--- `,
      );
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result,
      });
    } catch (error) {
      logger.error(
        `---OTP.CONTROLLER.RESET_PASSWORD ERROR--- ${error.message}`,
      );
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response || { message: error.message });
    }
  }
}
