import {
  IsNotEmpty,
  IsMongoId,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { UnitEnum } from 'src/utils/enums/unit.enum';

export class CreateIntrantStockDto {
  @IsOptional()
  @IsMongoId()
  lab: string;

  @IsNotEmpty()
  @IsMongoId()
  intrant: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  initialQuantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usedQuantity?: number;

  @IsNotEmpty()
  @IsEnum(UnitEnum)
  unit: UnitEnum;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minThreshold?: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: Date;

  @IsOptional()
  @IsString()
  batchNumber?: string;
}
