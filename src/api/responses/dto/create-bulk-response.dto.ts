import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BulkResponseItemDto } from './bulk-response-item.dto';

export class CreateBulkResponseDto {
  @IsOptional()
  @IsMongoId()
  lab?: string;

  @IsNotEmpty()
  @IsMongoId()
  investigation: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkResponseItemDto)
  responses: BulkResponseItemDto[];
}
