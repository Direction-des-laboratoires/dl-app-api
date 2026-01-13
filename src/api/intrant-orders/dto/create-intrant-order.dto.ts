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
import { IntrantOrderStatusEnum } from '../schemas/intrant-order.schema';

export class CreateIntrantOrderDto {
  @IsOptional()
  @IsMongoId()
  lab: string;

  @IsOptional()
  @IsMongoId()
  supplier?: string;

  @IsNotEmpty()
  @IsMongoId()
  intrant: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: Date;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsNotEmpty()
  @IsEnum(UnitEnum)
  unit: UnitEnum;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsEnum(IntrantOrderStatusEnum)
  status?: IntrantOrderStatusEnum;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsMongoId()
  validatedBy?: string;

  @IsOptional()
  @IsMongoId()
  completedBy?: string;
}
