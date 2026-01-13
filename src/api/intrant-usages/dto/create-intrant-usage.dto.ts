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

export class CreateIntrantUsageDto {
  @IsOptional()
  @IsMongoId()
  lab: string;

  @IsNotEmpty()
  @IsMongoId()
  intrant: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsMongoId()
  usedBy?: string;

  @IsOptional()
  @IsDateString()
  usageDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
