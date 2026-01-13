import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EquipmentStocksService } from './equipment-stocks.service';
import { EquipmentStocksController } from './equipment-stocks.controller';
import { EquipmentStockSchema } from './schemas/equipment-stock.schema';
import { EquipmentTypeSchema } from '../equipment-types/schemas/equipment-type.schema';
import { LabSchema } from '../labs/schemas/lab.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'EquipmentStock', schema: EquipmentStockSchema },
      { name: 'EquipmentType', schema: EquipmentTypeSchema },
      { name: 'Lab', schema: LabSchema },
    ]),
  ],
  controllers: [EquipmentStocksController],
  providers: [EquipmentStocksService],
  exports: [EquipmentStocksService, MongooseModule],
})
export class EquipmentStocksModule {}
