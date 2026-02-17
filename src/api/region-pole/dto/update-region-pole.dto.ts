import { PartialType } from '@nestjs/mapped-types';
import { CreateRegionPoleDto } from './create-region-pole.dto';

export class UpdateRegionPoleDto extends PartialType(CreateRegionPoleDto) {}
