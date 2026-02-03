import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnvironmentPositionService } from './environment-position.service';
import { EnvironmentPositionController } from './environment-position.controller';
import { EnvironmentPositionSchema } from './schemas/environment-position.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'EnvironmentPosition', schema: EnvironmentPositionSchema }]),
  ],
  controllers: [EnvironmentPositionController],
  providers: [EnvironmentPositionService],
  exports: [EnvironmentPositionService],
})
export class EnvironmentPositionModule {}
