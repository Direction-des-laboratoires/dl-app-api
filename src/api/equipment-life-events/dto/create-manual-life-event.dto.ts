import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsMongoId,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateManualLifeEventDto {
  @IsNotEmpty()
  @IsMongoId()
  equipment: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  summary: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
