import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateEquipmentCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
