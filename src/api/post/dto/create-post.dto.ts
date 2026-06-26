import { IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { PostTypesEnum } from 'src/utils/enums/post.enum';

export class CreatePostDto {
  @IsNotEmpty({ message: 'Le titre est requis' })
  @Transform(({ value }) => (typeof value === 'string' ? value?.trim() : value))
  title: string;

  @IsNotEmpty({ message: 'La description est requise' })
  @Transform(({ value }) => (typeof value === 'string' ? value?.trim() : value))
  description: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === undefined ? undefined : value,
  )
  type?: string;

  @ValidateIf((o) => o.type === PostTypesEnum.EVENT)
  @IsNotEmpty({ message: "La date d'événement est requise pour les événements" })
  @Transform(({ value }) =>
    value === '' || value === undefined ? undefined : value,
  )
  eventDate?: string;
}
