import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PromobileSmsService } from 'src/providers/sms-service/promobile.service';
import { OtpModule } from '../otp/otp.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [UserModule, JwtModule, ConfigModule, forwardRef(() => OtpModule)],
  controllers: [AuthController],
  providers: [AuthService, PromobileSmsService],
  exports: [AuthService],
})
export class AuthModule {}
