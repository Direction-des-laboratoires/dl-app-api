import { PartialType } from '@nestjs/mapped-types';
import { CreateLabTypePositionDto } from './create-lab-type-position.dto';

export class UpdateLabTypePositionDto extends PartialType(CreateLabTypePositionDto) {}
