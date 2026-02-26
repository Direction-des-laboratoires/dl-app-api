import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from 'src/api/user/dto/create-user.dto';

export class CreateLabAdminAccountDto extends PartialType(
  OmitType(CreateUserDto, ['role'] as const),
) {}
