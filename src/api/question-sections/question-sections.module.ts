import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionSectionsService } from './question-sections.service';
import { QuestionSectionsController } from './question-sections.controller';
import { QuestionSectionSchema } from './schemas/question-section.schema';
import { QuestionSchema } from '../questions/schemas/question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'QuestionSection', schema: QuestionSectionSchema },
      { name: 'Question', schema: QuestionSchema },
    ]),
  ],
  controllers: [QuestionSectionsController],
  providers: [QuestionSectionsService],
  exports: [QuestionSectionsService, MongooseModule],
})
export class QuestionSectionsModule {}
