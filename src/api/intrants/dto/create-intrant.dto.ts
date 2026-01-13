import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsMongoId,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { UnitEnum } from 'src/utils/enums/unit.enum';

export class CreateIntrantDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsMongoId()
  type: string;

  @IsOptional()
  @IsString()
  description?: string;
}
