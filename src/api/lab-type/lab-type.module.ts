import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LabTypeController } from './lab-type.controller';
import { LabTypeService } from './lab-type.service';
import { LabTypeSchema } from './schemas/lab-type.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'LabType', schema: LabTypeSchema }])],
  controllers: [LabTypeController],
  providers: [LabTypeService],
  exports: [LabTypeService],
})
export class LabTypeModule {}
