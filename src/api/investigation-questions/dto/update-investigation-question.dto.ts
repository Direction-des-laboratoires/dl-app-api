import { PartialType } from '@nestjs/mapped-types';
import { CreateInvestigationQuestionDto } from './create-investigation-question.dto';

export class UpdateInvestigationQuestionDto extends PartialType(
  CreateInvestigationQuestionDto,
) {}
