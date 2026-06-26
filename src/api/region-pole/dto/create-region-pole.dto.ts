import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRegionPoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
