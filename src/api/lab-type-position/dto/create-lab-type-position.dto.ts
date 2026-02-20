import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLabTypePositionDto {
  @IsMongoId()
  @IsNotEmpty()
  labType: string;

  @IsMongoId()
  @IsNotEmpty()
  position: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
