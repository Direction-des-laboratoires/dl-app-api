import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EquipmentLifeEventSchema } from './schemas/equipment-life-event.schema';
import { EquipmentLifeEventsService } from './equipment-life-events.service';
import { EquipmentLifeEventsController } from './equipment-life-events.controller';
import { EquipmentSchema } from '../equipments/schemas/equipment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'EquipmentLifeEvent', schema: EquipmentLifeEventSchema },
      { name: 'Equipment', schema: EquipmentSchema },
    ]),
  ],
  controllers: [EquipmentLifeEventsController],
  providers: [EquipmentLifeEventsService],
  exports: [EquipmentLifeEventsService],
})
export class EquipmentLifeEventsModule {}
