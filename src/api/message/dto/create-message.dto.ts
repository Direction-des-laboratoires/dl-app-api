import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsArray,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsMongoId,
  ValidateNested,
  IsDate,
  IsDateString,
  ArrayNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum CanalEnum {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  ALL = 'ALL',
}

export enum RegionAccessCanalEnum {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  ALL = 'ALL',
}

export class MessageRecipientsDto {
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  emails?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'string') return [parsed];
        return [value];
      } catch (e) {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item !== '');
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  exclusions?: string[];

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

  @IsOptional()
  @IsString()
  environmentId?: string;

  @IsOptional()
  @IsMongoId()
  region?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  environmentPositionIds?: string[];

  /**
   * Destinataires issus d'un fichier (Excel) importé côté front.
   * Chaque entrée est un objet dont les clés sont les noms de paramètres
   * choisis lors du mapping des colonnes (ex: firstname, email, phoneNumber, ...)
   * et les valeurs, le contenu de la cellule. Ces paramètres servent à la fois
   * de destinataires (email / phoneNumber) et de variables de personnalisation
   * du message ({{firstname}}, {{phoneNumber}}, ...).
   */
  @IsOptional()
  @IsArray()
  fileRecipients?: Array<Record<string, any>>;
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

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'string') return [parsed];
        return [value];
      } catch (e) {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item !== '');
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  exclusions?: string[];

  @IsOptional()
  @IsMongoId()
  region?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'string') return [parsed];
        return [value];
      } catch (e) {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item !== '');
      }
    }
    return value;
  })
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'string') return [parsed];
        return [value];
      } catch (e) {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item !== '');
      }
    }
    return value;
  })
  @IsArray()
  @IsEmail({}, { each: true })
  cci?: string[];

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
  //@IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  repeat?: string;
}

export class SendRegionAccessesDto {
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  @IsMongoId()
  region?: string;

  @IsOptional()
  @Transform(({ value }) => transformStringArray(value))
  @IsArray()
  @IsString({ each: true })
  exclusions?: string[];

  @IsOptional()
  @Transform(({ value }) => transformMongoIdArray(value))
  @IsArray()
  @IsMongoId({ each: true })
  userIds?: string[];

  @IsOptional()
  @Transform(({ value }) => transformMongoIdArray(value))
  @IsArray()
  @IsMongoId({ each: true })
  excludedRegions?: string[];

  @IsOptional()
  @Transform(({ value }) => transformMongoIdArray(value))
  @IsArray()
  @IsMongoId({ each: true })
  excludedLabs?: string[];

  @IsOptional()
  @Transform(({ value }) => transformMongoIdArray(value))
  @IsArray()
  @IsMongoId({ each: true })
  excludedStructures?: string[];

  @IsOptional()
  @IsEnum(RegionAccessCanalEnum)
  canal?: RegionAccessCanalEnum;
}

function transformStringArray(value: unknown): unknown {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return [parsed];
      return [value];
    } catch (e) {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== '');
    }
  }
  return value;
}

function transformMongoIdArray(value: unknown): unknown {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');
  }
  return value;
}

export class SendUserAccessesDto {
  @IsNotEmpty()
  @Transform(({ value }) => transformMongoIdArray(value))
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  userIds: string[];

  @IsOptional()
  @Transform(({ value }) => transformStringArray(value))
  @IsArray()
  @IsString({ each: true })
  exclusions?: string[];

  @IsOptional()
  @IsEnum(RegionAccessCanalEnum)
  canal?: RegionAccessCanalEnum;
}
