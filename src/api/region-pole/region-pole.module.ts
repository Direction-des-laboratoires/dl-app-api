import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegionPoleController } from './region-pole.controller';
import { RegionPoleService } from './region-pole.service';
import { RegionPoleSchema } from './schemas/region-pole.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'RegionPole', schema: RegionPoleSchema }]),
  ],
  controllers: [RegionPoleController],
  providers: [RegionPoleService],
  exports: [RegionPoleService],
})
export class RegionPoleModule {}
