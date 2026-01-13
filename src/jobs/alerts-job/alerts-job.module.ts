import { Module } from '@nestjs/common';
import { AlertsJobService } from './alerts-job.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertSchema } from 'src/api/alerts/schemas/alert.schema';
import { MaintenanceSchema } from 'src/api/maintenances/schemas/maintenance.schema';
import { EquipmentTypeSchema } from 'src/api/equipment-types/schemas/equipment-type.schema';
import { MailModule } from 'src/providers/mail-service/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Alert', schema: AlertSchema },
      { name: 'Maintenance', schema: MaintenanceSchema },
      { name: 'EquipmentType', schema: EquipmentTypeSchema },
    ]),
    MailModule,
  ],
  providers: [AlertsJobService],
})
export class AlertsJobModule {}
