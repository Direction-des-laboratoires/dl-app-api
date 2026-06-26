import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StructureLevelEquipmentTypeController } from './structure-level-equipment-type.controller';
import { StructureLevelEquipmentTypeService } from './structure-level-equipment-type.service';
import { StructureLevelEquipmentTypeSchema } from './schemas/structure-level-equipment-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'StructureLevelEquipmentType',
        schema: StructureLevelEquipmentTypeSchema,
      },
    ]),
  ],
  controllers: [StructureLevelEquipmentTypeController],
  providers: [StructureLevelEquipmentTypeService],
  exports: [StructureLevelEquipmentTypeService],
})
export class StructureLevelEquipmentTypeModule {}
