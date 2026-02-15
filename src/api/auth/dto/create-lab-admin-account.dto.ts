import { OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from 'src/api/user/dto/create-user.dto';

export class CreateLabAdminAccountDto extends OmitType(CreateUserDto, [
  'role',
] as const) {}
