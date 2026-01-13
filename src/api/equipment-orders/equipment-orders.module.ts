import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EquipmentOrdersService } from './equipment-orders.service';
import { EquipmentOrdersController } from './equipment-orders.controller';
import { EquipmentOrderSchema } from './schemas/equipment-order.schema';
import { EquipmentCategorySchema } from '../equipment-categories/schemas/equipment-category.schema';
import { EquipmentTypeSchema } from '../equipment-types/schemas/equipment-type.schema';
import { EquipmentStocksModule } from '../equipment-stocks/equipment-stocks.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'EquipmentOrder', schema: EquipmentOrderSchema },
      { name: 'EquipmentCategory', schema: EquipmentCategorySchema },
      { name: 'EquipmentType', schema: EquipmentTypeSchema },
    ]),
    EquipmentStocksModule,
  ],
  controllers: [EquipmentOrdersController],
  providers: [EquipmentOrdersService],
  exports: [EquipmentOrdersService, MongooseModule],
})
export class EquipmentOrdersModule {}
