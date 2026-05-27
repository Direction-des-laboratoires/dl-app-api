import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvestigationsService } from './investigations.service';
import { InvestigationsController } from './investigations.controller';
import { InvestigationSchema } from './schemas/investigation.schema';
import { InvestigationQuestionSchema } from '../investigation-questions/schemas/investigation-question.schema';
import { QuestionSchema } from '../questions/schemas/question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Investigation', schema: InvestigationSchema },
      { name: 'InvestigationQuestion', schema: InvestigationQuestionSchema },
      { name: 'Question', schema: QuestionSchema },
    ]),
  ],
  controllers: [InvestigationsController],
  providers: [InvestigationsService],
  exports: [InvestigationsService, MongooseModule],
})
export class InvestigationsModule {}
