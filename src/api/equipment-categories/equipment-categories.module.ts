import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EquipmentCategoriesService } from './equipment-categories.service';
import { EquipmentCategoriesController } from './equipment-categories.controller';
import { EquipmentCategorySchema } from './schemas/equipment-category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'EquipmentCategory', schema: EquipmentCategorySchema },
    ]),
  ],
  controllers: [EquipmentCategoriesController],
  providers: [EquipmentCategoriesService],
  exports: [EquipmentCategoriesService, MongooseModule],
})
export class EquipmentCategoriesModule {}
