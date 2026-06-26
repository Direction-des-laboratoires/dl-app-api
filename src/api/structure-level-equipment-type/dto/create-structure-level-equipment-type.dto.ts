import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateStructureLevelEquipmentTypeDto {
  @IsMongoId()
  @IsNotEmpty()
  structureLevel: string;

  @IsMongoId()
  @IsNotEmpty()
  equipmentType: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsBoolean()
  @IsOptional()
  required?: boolean;
}
