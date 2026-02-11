import { IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Gender } from 'src/utils/enums/gender.enum';
import { MaritalStatus } from 'src/utils/enums/marital-status.enum';

/* eslint-disable prettier/prettier */
export class CreateUserDto {
  @IsNotEmpty()
  firstname: string;

  @IsNotEmpty()
  lastname: string;

  @IsNotEmpty()
  phoneNumber: string;

  @IsNotEmpty()
  email: string;

  @IsOptional()
  lab: string;

  @IsOptional()
  @IsMongoId()
  environment: string;

  @IsOptional()
  @IsMongoId()
  environmentPosition: string;

  @IsOptional()
  @IsMongoId()
  contractType: string;

  @IsNotEmpty()
  @IsMongoId()
  level: string;

  @IsOptional()
  specialities: string[];

  @IsOptional()
  region: string;

  @IsNotEmpty()
  role: string;

  @IsOptional()
  identificationType: string;

  @IsOptional()
  @IsString()
  identificationNumber: string;

  @IsOptional()
  @IsBoolean()
  disabled: boolean;

  @IsOptional()
  @IsString()
  disabilityDetails: string;

  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus: MaritalStatus;

  @IsOptional()
  @IsNumber()
  numberOfChildren: number;

  @IsOptional()
  @IsNumber()
  numberOfWives: number;

  @IsNotEmpty()
  birthday: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  nationality: string;

  @IsOptional()
  profilePicture: string;

  @IsOptional()
  entryDate: Date;

  @IsOptional()
  bloodGroup: string;
}

export class CreateLabStaffDto {
  @IsNotEmpty()
  firstname: string;

  @IsNotEmpty()
  lastname: string;

  @IsNotEmpty()
  phoneNumber: string;

  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsMongoId()
  lab: string;

  @IsOptional()
  @IsMongoId()
  environment: string;

  @IsOptional()
  @IsMongoId()
  environmentPosition: string;

  @IsNotEmpty()
  @IsMongoId()
  contractType: string;

  @IsOptional()
  region:string

  @IsOptional()
  identificationType: string;

  @IsOptional()
  @IsString()
  identificationNumber: string;

  @IsOptional()
  @IsBoolean()
  isDisabled: boolean;

  @IsOptional()
  @IsString()
  disabilityDescription: string;

  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus: MaritalStatus;

  @IsOptional()
  @IsNumber()
  numberOfChildren: number;

  @IsOptional()
  @IsNumber()
  numberOfWives: number;

  @IsNotEmpty()
  birthday: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  nationality: string;

  @IsOptional()
  profilePicture: string;

  @IsNotEmpty()
  entryDate: Date;

  @IsOptional()
  bloodGroup: string;
}
