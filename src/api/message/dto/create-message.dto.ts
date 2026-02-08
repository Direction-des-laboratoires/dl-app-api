import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsArray,
  IsEmail,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsDate,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum CanalEnum {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export class MessageRecipientsDto {
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  emails?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phoneNumbers?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @IsOptional()
  @IsBoolean()
  allDirectors?: boolean;

  @IsOptional()
  @IsBoolean()
  allResponsibles?: boolean;

  @IsOptional()
  @IsBoolean()
  allSuperAdmins?: boolean;

  @IsOptional()
  @IsBoolean()
  allLabAdmins?: boolean;

  @IsOptional()
  @IsBoolean()
  allRegionAdmins?: boolean;

  @IsOptional()
  @IsBoolean()
  allStaffs?: boolean;
}

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsEnum(CanalEnum)
  canal: CanalEnum;

  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        // Si le parsing réussit, on retourne l'objet
        return parsed;
      } catch (e) {
        return value;
      }
    }
    return value;
  })
  recipients: MessageRecipientsDto;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  repeat?: string;
}
