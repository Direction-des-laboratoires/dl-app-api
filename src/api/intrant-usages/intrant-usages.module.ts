import { Module } from '@nestjs/common';
import { IntrantUsagesService } from './intrant-usages.service';
import { IntrantUsagesController } from './intrant-usages.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { IntrantUsageSchema } from './schemas/intrant-usage.schema';
import { IntrantStockSchema } from '../intrant-stocks/schemas/intrant-stock.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'IntrantUsage', schema: IntrantUsageSchema },
      { name: 'IntrantStock', schema: IntrantStockSchema },
    ]),
  ],
  controllers: [IntrantUsagesController],
  providers: [IntrantUsagesService],
  exports: [IntrantUsagesService],
})
export class IntrantUsagesModule {}

