import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponsesService } from './responses.service';
import { ResponsesController } from './responses.controller';
import { ResponseSchema } from './schemas/response.schema';
import { QuestionSchema } from '../questions/schemas/question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Response', schema: ResponseSchema },
      { name: 'Question', schema: QuestionSchema },
    ]),
  ],
  controllers: [ResponsesController],
  providers: [ResponsesService],
  exports: [ResponsesService],
})
export class ResponsesModule {}
