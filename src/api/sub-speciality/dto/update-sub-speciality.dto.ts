import { PartialType } from '@nestjs/mapped-types';
import { CreateSubSpecialityDto } from './create-sub-speciality.dto';

export class UpdateSubSpecialityDto extends PartialType(CreateSubSpecialityDto) {}
