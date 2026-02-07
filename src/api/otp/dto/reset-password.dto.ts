import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsEnum,
  MinLength,
} from 'class-validator';
import { OtpTypeEnum } from '../schemas/otp.schema';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  newPassword: string;
}
