import { Module } from '@nestjs/common';
import { MaintenancesService } from './maintenances.service';
import { MaintenancesController } from './maintenances.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MaintenanceSchema } from './schemas/maintenance.schema';
import { EquipmentSchema } from '../equipments/schemas/equipment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Maintenance', schema: MaintenanceSchema },
      { name: 'Equipment', schema: EquipmentSchema },
    ]),
  ],
  controllers: [MaintenancesController],
  providers: [MaintenancesService],
  exports: [MaintenancesService],
})
export class MaintenancesModule {}
