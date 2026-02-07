import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLabDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  structure?: string;

  @IsOptional()
  @IsString()
  latLng?: string; // Format: "lat,lng"

  @IsNotEmpty()
  director: string;

  @IsNotEmpty()
  responsible: string;

  @IsNotEmpty()
  phoneNumber: string;

  @IsEmail()
  email: string;

  @IsOptional()
  specialities: string[];
}
