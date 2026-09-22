import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponsibleHandoverService } from './responsible-handover.service';
import { ResponsibleHandoverController } from './responsible-handover.controller';
import { ResponsibleHandoverSchema } from './schemas/responsible-handover.schema';
import { UserSchema } from '../user/schemas/user.schema';
import { LabSchema } from '../labs/schemas/lab.schema';
import { StaffLevelSchema } from '../staff-level/schemas/staff-level.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ResponsibleHandover', schema: ResponsibleHandoverSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Lab', schema: LabSchema },
      { name: 'StaffLevel', schema: StaffLevelSchema },
    ]),
  ],
  controllers: [ResponsibleHandoverController],
  providers: [ResponsibleHandoverService],
})
export class ResponsibleHandoverModule {}
