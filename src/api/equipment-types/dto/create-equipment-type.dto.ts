import { IsNotEmpty, IsString, IsOptional, IsMongoId } from 'class-validator';

export class CreateEquipmentTypeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsMongoId()
  equipmentCategory?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
