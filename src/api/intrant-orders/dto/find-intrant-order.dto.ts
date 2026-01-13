import { IsOptional, IsMongoId, IsEnum, IsString, IsNumberString } from 'class-validator';
import { IntrantOrderStatusEnum } from '../schemas/intrant-order.schema';

export class FindIntrantOrderDto {
  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  @IsNumberString()
  limit?: number;

  @IsOptional()
  @IsMongoId()
  lab?: string;

  @IsOptional()
  @IsMongoId()
  intrant?: string;

  @IsOptional()
  @IsMongoId()
  supplier?: string;

  @IsOptional()
  @IsEnum(IntrantOrderStatusEnum)
  status?: IntrantOrderStatusEnum;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
