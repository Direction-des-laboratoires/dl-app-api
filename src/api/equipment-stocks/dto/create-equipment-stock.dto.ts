import { IsNotEmpty, IsMongoId, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { UnitEnum } from 'src/utils/enums/unit.enum';

export class CreateEquipmentStockDto {
  @IsOptional()
  @IsMongoId()
  lab: string;

  @IsNotEmpty()
  @IsMongoId()
  equipmentType: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  initialQuantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usedQuantity?: number;

  @IsOptional()
  @IsEnum(UnitEnum)
  unit?: UnitEnum;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  minThreshold: number;

  @IsOptional()
  @IsMongoId()
  order?: string;
}
