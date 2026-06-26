import { PartialType } from '@nestjs/mapped-types';
import { CreateStructureLevelEquipmentTypeDto } from './create-structure-level-equipment-type.dto';

export class UpdateStructureLevelEquipmentTypeDto extends PartialType(
  CreateStructureLevelEquipmentTypeDto,
) {}
