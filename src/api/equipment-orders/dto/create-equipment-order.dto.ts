import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsMongoId,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { OrderStatusEnum } from '../schemas/equipment-order.schema';
import { UnitEnum } from 'src/utils/enums/unit.enum';

export class CreateEquipmentOrderDto {
  @IsOptional()
  @IsMongoId()
  lab: string;

  @IsOptional()
  @IsMongoId()
  supplier: string;

  @IsNotEmpty()
  @IsMongoId()
  equipmentType: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDateString()
  purchaseDate: Date;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsEnum(UnitEnum)
  unit: UnitEnum;

  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;

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
