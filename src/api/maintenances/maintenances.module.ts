import { Module } from '@nestjs/common';
import { MaintenancesService } from './maintenances.service';
import { MaintenancesController } from './maintenances.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MaintenanceSchema } from './schemas/maintenance.schema';
import { EquipmentSchema } from '../equipments/schemas/equipment.schema';
import { UserSchema } from '../user/schemas/user.schema';
import { LabSchema } from '../labs/schemas/lab.schema';
import { StructureSchema } from '../structure/schemas/structure.schema';
import { EquipmentLifeEventsModule } from '../equipment-life-events/equipment-life-events.module';

@Module({
  imports: [
    EquipmentLifeEventsModule,
    MongooseModule.forFeature([
      { name: 'Maintenance', schema: MaintenanceSchema },
      { name: 'Equipment', schema: EquipmentSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Lab', schema: LabSchema },
      { name: 'Structure', schema: StructureSchema },
    ]),
  ],
  controllers: [MaintenancesController],
  providers: [MaintenancesService],
  exports: [MaintenancesService],
})
export class MaintenancesModule {}
