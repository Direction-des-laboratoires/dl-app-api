import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { QuestionSchema } from './schemas/question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Question', schema: QuestionSchema }]),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService, MongooseModule],
})
export class QuestionsModule {}
