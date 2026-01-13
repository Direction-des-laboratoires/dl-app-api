import { IsOptional, IsString, IsNumberString, IsMongoId, IsEnum } from 'class-validator';
import { MaintenanceType, MaintenanceStatus, ScheduleFrequency } from '../schemas/maintenance.schema';

export class FindMaintenanceDto {
  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  @IsNumberString()
  limit?: number;

  @IsOptional()
  @IsMongoId()
  equipment?: string;

  @IsOptional()
  @IsEnum(MaintenanceType)
  maintenanceType?: MaintenanceType;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsMongoId()
  technician?: string;

  @IsOptional()
  @IsEnum(ScheduleFrequency)
  frequency?: ScheduleFrequency;

  @IsOptional()
  @IsString()
  search?: string;
}
