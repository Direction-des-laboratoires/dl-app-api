import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { InvestigationStatusEnum } from 'src/utils/enums/investigation-status.enum';
import { InvestigationType } from 'src/utils/enums/investigation-type.enum';

export class FindInvestigationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsEnum(InvestigationType)
  type?: InvestigationType;

  @IsOptional()
  @IsEnum(InvestigationStatusEnum)
  status?: InvestigationStatusEnum;

  @IsOptional()
  @IsString()
  search?: string;
}
