import { Module } from '@nestjs/common';
import { IntrantStocksService } from './intrant-stocks.service';
import { IntrantStocksController } from './intrant-stocks.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { IntrantStockSchema } from './schemas/intrant-stock.schema';
import { IntrantOrderSchema } from '../intrant-orders/schemas/intrant-order.schema';
import { LabSchema } from '../labs/schemas/lab.schema';
import { StructureSchema } from '../structure/schemas/structure.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'IntrantStock', schema: IntrantStockSchema },
      { name: 'IntrantOrder', schema: IntrantOrderSchema },
      { name: 'Lab', schema: LabSchema },
      { name: 'Structure', schema: StructureSchema },
    ]),
  ],
  controllers: [IntrantStocksController],
  providers: [IntrantStocksService],
  exports: [IntrantStocksService],
})
export class IntrantStocksModule {}

