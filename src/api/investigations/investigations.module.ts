import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvestigationsService } from './investigations.service';
import { InvestigationsController } from './investigations.controller';
import { InvestigationSchema } from './schemas/investigation.schema';
import { InvestigationQuestionSchema } from '../investigation-questions/schemas/investigation-question.schema';
import { QuestionSchema } from '../questions/schemas/question.schema';
import { LabSchema } from '../labs/schemas/lab.schema';
import { StructureSchema } from '../structure/schemas/structure.schema';
import { ResponseSchema } from '../responses/schemas/response.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Investigation', schema: InvestigationSchema },
      { name: 'InvestigationQuestion', schema: InvestigationQuestionSchema },
      { name: 'Question', schema: QuestionSchema },
      { name: 'Lab', schema: LabSchema },
      { name: 'Structure', schema: StructureSchema },
      { name: 'Response', schema: ResponseSchema },
    ]),
  ],
  controllers: [InvestigationsController],
  providers: [InvestigationsService],
  exports: [InvestigationsService, MongooseModule],
})
export class InvestigationsModule {}
