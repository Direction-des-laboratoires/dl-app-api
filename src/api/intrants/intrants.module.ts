import { Module } from '@nestjs/common';
import { IntrantsService } from './intrants.service';
import { IntrantsController } from './intrants.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { IntrantSchema } from './schemas/intrant.schema';
import { IntrantTypeSchema } from '../intrant-types/schemas/intrant-type.schema';
import { IntrantStocksModule } from '../intrant-stocks/intrant-stocks.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Intrant', schema: IntrantSchema },
      { name: 'IntrantType', schema: IntrantTypeSchema },
    ]),
    IntrantStocksModule,
  ],
  controllers: [IntrantsController],
  providers: [IntrantsService],
  exports: [IntrantsService],
})
export class IntrantsModule {}
