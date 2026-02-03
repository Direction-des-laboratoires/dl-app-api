import { PartialType } from '@nestjs/mapped-types';
import { CreateEnvironmentPositionDto } from './create-environment-position.dto';

export class UpdateEnvironmentPositionDto extends PartialType(CreateEnvironmentPositionDto) {}
