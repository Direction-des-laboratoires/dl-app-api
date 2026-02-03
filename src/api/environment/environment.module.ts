import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnvironmentService } from './environment.service';
import { EnvironmentController } from './environment.controller';
import { EnvironmentSchema } from './schemas/environment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Environment', schema: EnvironmentSchema }]),
  ],
  controllers: [EnvironmentController],
  providers: [EnvironmentService],
  exports: [EnvironmentService],
})
export class EnvironmentModule {}
