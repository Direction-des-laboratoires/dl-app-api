import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateResponseDto {
  @IsOptional()
  @IsMongoId()
  lab?: string;

  @IsNotEmpty()
  @IsMongoId()
  question: string;

  @IsNotEmpty()
  responseValue: string | number;

  @IsOptional()
  @IsString()
  responseValuePrecision?: string;
}
