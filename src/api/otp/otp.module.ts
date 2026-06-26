import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { OtpSchema } from './schemas/otp.schema';
import { UserSchema } from '../user/schemas/user.schema';
import { MailModule } from 'src/providers/mail-service/mail.module';

import { forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Otp', schema: OtpSchema },
      { name: 'User', schema: UserSchema },
    ]),
    MailModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
