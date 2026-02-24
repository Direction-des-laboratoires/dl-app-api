import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateSubSpecialityDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  description: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  rank?: number;
}
