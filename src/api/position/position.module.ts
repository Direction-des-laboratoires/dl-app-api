import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PositionService } from './position.service';
import { PositionController } from './position.controller';
import { PositionSchema } from './schemas/position.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Position', schema: PositionSchema }]),
  ],
  controllers: [PositionController],
  providers: [PositionService],
  exports: [PositionService],
})
export class PositionModule {}
