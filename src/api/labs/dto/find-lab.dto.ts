import { IsOptional, IsArray, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindLabsDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsMongoId()
  structure?: string;

  @IsOptional()
  type?: string;

  @IsOptional()
  @IsMongoId()
  region?: string;

  @IsOptional()
  @IsMongoId()
  department?: string;

  @IsOptional()
  @IsMongoId()
  district?: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  search?: string;

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
