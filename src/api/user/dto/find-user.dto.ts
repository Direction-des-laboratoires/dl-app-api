import {
  IsOptional,
  IsArray,
  IsMongoId,
  IsString,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender } from 'src/utils/enums/gender.enum';
import { MaritalStatus } from 'src/utils/enums/marital-status.enum';

export class FindUsersDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsString()
  firstname?: string;

  @IsOptional()
  @IsString()
  lastname?: string;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  disabled?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsMongoId()
  lab?: string;

  @IsOptional()
  @IsMongoId()
  environment?: string;

  @IsOptional()
  @IsMongoId()
  environmentPosition?: string;

  @IsOptional()
  @IsMongoId()
  contractType?: string;

  @IsOptional()
  @IsMongoId()
  level?: string;

  @IsOptional()
  @IsMongoId()
  region?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    // Si c'est déjà un tableau, le retourner tel quel
    if (Array.isArray(value)) {
      return value;
    }
    // Si c'est une string, la transformer en tableau
    if (typeof value === 'string') {
      return value.split(',').map((id) => id.trim());
    }
    return value;
  })
  @IsArray()
  @IsMongoId({ each: true })
  specialities?: string[];
}
