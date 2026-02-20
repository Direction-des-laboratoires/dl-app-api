import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LabTypePositionController } from './lab-type-position.controller';
import { LabTypePositionService } from './lab-type-position.service';
import { LabTypePositionSchema } from './schemas/lab-type-position.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'LabTypePosition', schema: LabTypePositionSchema }]),
  ],
  controllers: [LabTypePositionController],
  providers: [LabTypePositionService],
  exports: [LabTypePositionService],
})
export class LabTypePositionModule {}
