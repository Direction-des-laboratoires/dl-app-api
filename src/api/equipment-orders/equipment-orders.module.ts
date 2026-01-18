import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EquipmentOrdersService } from './equipment-orders.service';
import { EquipmentOrdersController } from './equipment-orders.controller';
import { EquipmentOrderSchema } from './schemas/equipment-order.schema';
import { EquipmentCategorySchema } from '../equipment-categories/schemas/equipment-category.schema';
import { EquipmentTypeSchema } from '../equipment-types/schemas/equipment-type.schema';
import { EquipmentStocksModule } from '../equipment-stocks/equipment-stocks.module';
import { LabSchema } from '../labs/schemas/lab.schema';
import { SupplierSchema } from '../suppliers/schemas/supplier.schema';
import { StructureSchema } from '../structure/schemas/structure.schema';
import { EquipmentsModule } from '../equipments/equipments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'EquipmentOrder', schema: EquipmentOrderSchema },
      { name: 'EquipmentCategory', schema: EquipmentCategorySchema },
      { name: 'EquipmentType', schema: EquipmentTypeSchema },
      { name: 'Lab', schema: LabSchema },
      { name: 'Supplier', schema: SupplierSchema },
      { name: 'Structure', schema: StructureSchema },
    ]),
    EquipmentStocksModule,
    EquipmentsModule,
  ],
  controllers: [EquipmentOrdersController],
  providers: [EquipmentOrdersService],
  exports: [EquipmentOrdersService, MongooseModule],
})
export class EquipmentOrdersModule {}
