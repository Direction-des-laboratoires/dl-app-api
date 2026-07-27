import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BulkResponseItemDto {
  @IsNotEmpty()
  @IsMongoId()
  question: string;

  @IsNotEmpty()
  responseValue: string | number;

  @IsOptional()
  @IsString()
  responseValuePrecision?: string;

  @IsOptional()
  @IsString()
  precisionOptionAutre?: string;
}
