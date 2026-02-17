import { Module } from '@nestjs/common';
import { RegionService } from './region.service';
import { RegionController } from './region.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RegionSchema } from './schemas/region.schema';
import { RegionPoleSchema } from '../region-pole/schemas/region-pole.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Region', schema: RegionSchema },
      { name: 'RegionPole', schema: RegionPoleSchema },
    ]),
  ],
  controllers: [RegionController],
  providers: [RegionService],
})
export class RegionModule {}
