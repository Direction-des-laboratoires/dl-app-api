import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// Toutes les infos du nouveau responsable sont obligatoires avant remplacement
export class ReplaceResponsibleDto {
  @IsNotEmpty()
  @IsString()
  firstname: string;

  @IsNotEmpty()
  @IsString()
  lastname: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;
}
