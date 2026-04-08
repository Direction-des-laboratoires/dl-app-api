import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsMongoId,
  IsEnum,
  IsNumberString,
  IsDateString,
  IsString,
  IsArray,
  IsIn,
  MaxLength,
} from 'class-validator';
import { EquipmentLifeEventKind } from '../schemas/equipment-life-event.schema';

export class FindEquipmentLifeEventDto {
  /** Si absent : liste selon le périmètre laboratoire (SuperAdmin peut filtrer via `lab` ou tout voir). */
  @IsOptional()
  @IsMongoId()
  equipment?: string;

  /**
   * Uniquement SuperAdmin : restreindre aux événements des équipements de ce laboratoire
   * (ignoré si `equipment` est fourni).
   */
  @IsOptional()
  @IsMongoId()
  lab?: string;

  @IsOptional()
  @IsEnum(EquipmentLifeEventKind)
  kind?: EquipmentLifeEventKind;

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    if (Array.isArray(value)) return value;
    return String(value)
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  })
  @IsArray()
  @IsEnum(EquipmentLifeEventKind, { each: true })
  kinds?: EquipmentLifeEventKind[];

  @IsOptional()
  @IsMongoId()
  maintenance?: string;

  @IsOptional()
  @IsMongoId()
  actor?: string;

  @IsOptional()
  @IsDateString()
  occurredFrom?: string;

  @IsOptional()
  @IsDateString()
  occurredTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  /** Tri sur `occurredAt` : `desc` (défaut) ou `asc`. */
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';

  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  @IsNumberString()
  limit?: number;
}
