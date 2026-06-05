import { HttpException, HttpStatus } from '@nestjs/common';
import { ResponseValueTypeEnum } from 'src/utils/enums/response-value-type.enum';

export function validateQuestionConfig(config: {
  responseValueType: ResponseValueTypeEnum;
  options?: string[];
  responsePrecisionCondition?: string | number | null;
}): void {
  const options = config.options ?? [];

  if (config.responseValueType === ResponseValueTypeEnum.SINGLE_CHOICE) {
    if (options.length === 0) {
      throw new HttpException(
        'Au moins une option est requise pour une question de type SINGLE_CHOICE',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (options.some((option) => typeof option !== 'string' || !option.trim())) {
      throw new HttpException(
        'Chaque option doit être une chaîne non vide',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (new Set(options).size !== options.length) {
      throw new HttpException(
        'Les options ne doivent pas contenir de doublons',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      config.responsePrecisionCondition != null &&
      !options.includes(String(config.responsePrecisionCondition))
    ) {
      throw new HttpException(
        'responsePrecisionCondition doit correspondre à une des options',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
