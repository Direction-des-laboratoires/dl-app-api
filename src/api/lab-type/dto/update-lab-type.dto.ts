import { PartialType } from '@nestjs/mapped-types';
import { CreateLabTypeDto } from './create-lab-type.dto';

export class UpdateLabTypeDto extends PartialType(CreateLabTypeDto) {}
