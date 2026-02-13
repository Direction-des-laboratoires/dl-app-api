import { Module } from '@nestjs/common';
import { LabsService } from './labs.service';
import { LabsController } from './labs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { LabSchema } from './schemas/lab.schema';
import { StructureSchema } from 'src/api/structure/schemas/structure.schema';
import { UserSchema } from '../user/schemas/user.schema';
import { StaffLevelSchema } from '../staff-level/schemas/staff-level.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Lab', schema: LabSchema },
      { name: 'Structure', schema: StructureSchema },
      { name: 'User', schema: UserSchema },
      { name: 'StaffLevel', schema: StaffLevelSchema },
    ]),
  ],
  controllers: [LabsController],
  providers: [LabsService],
})
export class LabsModule {}
