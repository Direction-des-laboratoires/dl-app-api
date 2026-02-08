import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { Gender } from 'src/utils/enums/gender.enum';

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
  regionId: string;

  @IsNotEmpty()
  role: string;

  @IsNotEmpty()
  identificationType: string;

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

  @IsOptional()
  @IsMongoId()
  contractType: string;

  @IsOptional()
  identificationType: string;

  @IsNotEmpty()
  birthday: string;

  @IsOptional()
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
