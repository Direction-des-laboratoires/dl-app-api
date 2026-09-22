import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { NewResponsibleDto } from './new-responsible.dto';

export class CreateHandoverDto {
  // true = l'utilisateur confirme être toujours responsable
  // false = l'utilisateur signale qu'il a changé
  @IsOptional()
  @IsBoolean()
  stillResponsible?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewResponsibleDto)
  newResponsible?: NewResponsibleDto;
}
