import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EquipmentStocksService } from './equipment-stocks.service';
import { EquipmentStocksController } from './equipment-stocks.controller';
import { EquipmentStockSchema } from './schemas/equipment-stock.schema';
import { EquipmentTypeSchema } from '../equipment-types/schemas/equipment-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'EquipmentStock', schema: EquipmentStockSchema },
      { name: 'EquipmentType', schema: EquipmentTypeSchema },
    ]),
  ],
  controllers: [EquipmentStocksController],
  providers: [EquipmentStocksService],
  exports: [EquipmentStocksService, MongooseModule],
})
export class EquipmentStocksModule {}
