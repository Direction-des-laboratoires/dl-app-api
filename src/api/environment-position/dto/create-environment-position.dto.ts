import { IsNotEmpty, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class CreateEnvironmentPositionDto {
  @IsMongoId()
  @IsNotEmpty()
  environment: string;

  @IsMongoId()
  @IsNotEmpty()
  position: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
