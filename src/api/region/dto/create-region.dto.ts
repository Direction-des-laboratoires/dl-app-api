import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateRegionDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  code: string;

  @IsNotEmpty()
  @IsMongoId()
  pole: string;
}
