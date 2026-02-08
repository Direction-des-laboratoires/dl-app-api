/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { ProfessionalExperienceSchema } from '../professional-experience/schemas/professional-experience.schema';
import { TrainingSchema } from '../training/schemas/training.schema';
import { ContractTypeModule } from '../contract-type/contract-type.module';
import { LabSchema } from '../labs/schemas/lab.schema';
import { PositionSchema } from '../position/schemas/position.schema';
import { EnvironmentPositionSchema } from '../environment-position/schemas/environment-position.schema';
import { EnvironmentSchema } from '../environment/schemas/environment.schema';
import { EnvironmentModule } from '../environment/environment.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'ProfessionalExperience', schema: ProfessionalExperienceSchema },
      { name: 'Training', schema: TrainingSchema },
      { name: 'Lab', schema: LabSchema },
      { name: 'Position', schema: PositionSchema },
      { name: 'EnvironmentPosition', schema: EnvironmentPositionSchema },
      { name: 'Environment', schema: EnvironmentSchema },
    ]),
    ContractTypeModule,
    EnvironmentModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
