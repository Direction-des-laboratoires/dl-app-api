import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStaffLevelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsOptional()
  rank: number;
}
