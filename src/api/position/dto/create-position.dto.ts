import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
