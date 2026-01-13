import { Module } from '@nestjs/common';
import { IntrantStocksService } from './intrant-stocks.service';
import { IntrantStocksController } from './intrant-stocks.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { IntrantStockSchema } from './schemas/intrant-stock.schema';
import { IntrantOrderSchema } from '../intrant-orders/schemas/intrant-order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'IntrantStock', schema: IntrantStockSchema },
      { name: 'IntrantOrder', schema: IntrantOrderSchema },
    ]),
  ],
  controllers: [IntrantStocksController],
  providers: [IntrantStocksService],
  exports: [IntrantStocksService],
})
export class IntrantStocksModule {}

