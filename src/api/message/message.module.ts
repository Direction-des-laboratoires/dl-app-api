import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MessageSchema } from './schemas/message.schema';
import { MailModule } from 'src/providers/mail-service/mail.module';
import { PromobileSmsService } from 'src/providers/sms-service/promobile.service';
import { OsmsSmsService } from 'src/providers/sms-service/osms.service';
import { UserSchema } from 'src/api/user/schemas/user.schema';
import { LabSchema } from 'src/api/labs/schemas/lab.schema';
import { RegionSchema } from 'src/api/region/schemas/region.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Message', schema: MessageSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Lab', schema: LabSchema },
      { name: 'Region', schema: RegionSchema },
    ]),
    MailModule,
  ],
  controllers: [MessageController],
  providers: [MessageService, PromobileSmsService, OsmsSmsService],
  exports: [MessageService],
})
export class MessageModule {}
