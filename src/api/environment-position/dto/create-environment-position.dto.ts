import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class CreateEnvironmentPositionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsMongoId()
  @IsNotEmpty()
  environment: string;

  @IsString()
  @IsOptional()
  description?: string;
}
