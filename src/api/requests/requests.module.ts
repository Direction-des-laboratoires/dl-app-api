import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestSchema } from './schemas/request.schema';
import { RequestCommentSchema } from '../request-comment/schemas/request-comment.schema';
import { LabSchema } from '../labs/schemas/lab.schema';
import { StructureSchema } from '../structure/schemas/structure.schema';
import { AmmImportModule } from './amm-import/amm-import.module';
import { LabOpeningModule } from './lab-opening/lab-opening.module';
import { SdrAccreditationModule } from './sdr-accreditation/sdr-accreditation.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Request', schema: RequestSchema },
      { name: 'RequestComment', schema: RequestCommentSchema },
      { name: 'Lab', schema: LabSchema },
      { name: 'Structure', schema: StructureSchema },
    ]),
    AmmImportModule,
    LabOpeningModule,
    SdrAccreditationModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [AmmImportModule, LabOpeningModule, SdrAccreditationModule],
})
export class RequestsModule {}
