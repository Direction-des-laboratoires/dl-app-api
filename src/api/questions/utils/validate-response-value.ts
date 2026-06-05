import { HttpException, HttpStatus } from '@nestjs/common';
import { ResponseValueTypeEnum } from 'src/utils/enums/response-value-type.enum';
import { YesNoResponseEnum } from 'src/utils/enums/yes-no-response.enum';

export function validateResponseValue(
  question: {
    responseValueType: ResponseValueTypeEnum;
    options?: string[];
  },
  responseValue: unknown,
): void {
  switch (question.responseValueType) {
    case ResponseValueTypeEnum.YES_NO:
      if (
        typeof responseValue !== 'string' ||
        !Object.values(YesNoResponseEnum).includes(responseValue as YesNoResponseEnum)
      ) {
        throw new HttpException(
          `responseValue doit être "${YesNoResponseEnum.YES}" ou "${YesNoResponseEnum.NO}" pour une question de type YES_NO`,
          HttpStatus.BAD_REQUEST,
        );
      }
      break;
    case ResponseValueTypeEnum.STRING:
      if (typeof responseValue !== 'string') {
        throw new HttpException(
          'responseValue doit être une chaîne de caractères pour une question de type STRING',
          HttpStatus.BAD_REQUEST,
        );
      }
      break;
    case ResponseValueTypeEnum.NUMBER:
      if (typeof responseValue !== 'number' || Number.isNaN(responseValue)) {
        throw new HttpException(
          'responseValue doit être un nombre pour une question de type NUMBER',
          HttpStatus.BAD_REQUEST,
        );
      }
      break;
    case ResponseValueTypeEnum.SINGLE_CHOICE: {
      const options = question.options ?? [];
      if (
        typeof responseValue !== 'string' ||
        !options.includes(responseValue)
      ) {
        throw new HttpException(
          `responseValue doit être l'une des options suivantes : ${options.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      break;
    }
    default:
      throw new HttpException(
        'Type de réponse de la question non supporté',
        HttpStatus.BAD_REQUEST,
      );
  }
}
