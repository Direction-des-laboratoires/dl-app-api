import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvestigationQuestionsService } from './investigation-questions.service';
import { InvestigationQuestionsController } from './investigation-questions.controller';
import { InvestigationQuestionSchema } from './schemas/investigation-question.schema';
import { InvestigationSchema } from '../investigations/schemas/investigation.schema';
import { QuestionSchema } from '../questions/schemas/question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'InvestigationQuestion', schema: InvestigationQuestionSchema },
      { name: 'Investigation', schema: InvestigationSchema },
      { name: 'Question', schema: QuestionSchema },
    ]),
  ],
  controllers: [InvestigationQuestionsController],
  providers: [InvestigationQuestionsService],
  exports: [InvestigationQuestionsService],
})
export class InvestigationQuestionsModule {}
