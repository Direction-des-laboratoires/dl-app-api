import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsMongoId,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatusEnum } from '../schemas/equipment-order.schema';
import { UnitEnum } from 'src/utils/enums/unit.enum';

export class EquipmentOrderItemDto {
  @IsNotEmpty()
  @IsMongoId()
  equipmentType: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsEnum(UnitEnum)
  unit: UnitEnum;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  purchasePrice: number;
}

export class CreateEquipmentOrderDto {
  @IsOptional()
  @IsMongoId()
  lab: string;

  @IsOptional()
  @IsMongoId()
  supplier: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentOrderItemDto)
  cart: EquipmentOrderItemDto[];

  @IsNotEmpty()
  @IsDateString()
  purchaseDate: Date;

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
