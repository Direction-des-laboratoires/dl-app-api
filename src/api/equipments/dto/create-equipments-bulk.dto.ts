import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateEquipmentDto } from './create-equipment.dto';

export class CreateEquipmentsBulkDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins un équipement est requis' })
  @ArrayMaxSize(100, { message: 'Maximum 100 équipements par requête' })
  @ValidateNested({ each: true })
  @Type(() => CreateEquipmentDto)
  equipments: CreateEquipmentDto[];
}
