import { PartialType } from '@nestjs/mapped-types';
import { CreateIntrantUsageDto } from './create-intrant-usage.dto';

export class UpdateIntrantUsageDto extends PartialType(CreateIntrantUsageDto) {}

