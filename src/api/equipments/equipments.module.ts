import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EquipmentsService } from './equipments.service';
import { EquipmentsController } from './equipments.controller';
import { EquipmentSchema } from './schemas/equipment.schema';
import { EquipmentStocksModule } from '../equipment-stocks/equipment-stocks.module';
import { EquipmentTypesModule } from '../equipment-types/equipment-types.module';
import { EquipmentOrderSchema } from '../equipment-orders/schemas/equipment-order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Equipment', schema: EquipmentSchema },
      { name: 'EquipmentOrder', schema: EquipmentOrderSchema },
    ]),
    EquipmentStocksModule,
    EquipmentTypesModule,
  ],
  controllers: [EquipmentsController],
  providers: [EquipmentsService],
  exports: [EquipmentsService, MongooseModule],
})
export class EquipmentsModule {}
