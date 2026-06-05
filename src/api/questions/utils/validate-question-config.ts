import { HttpException, HttpStatus } from '@nestjs/common';
import { ResponseValueTypeEnum } from 'src/utils/enums/response-value-type.enum';

function validateOptionsList(
  options: string[],
  fieldLabel: string,
): void {
  if (options.length === 0) {
    throw new HttpException(
      `Au moins une option est requise pour ${fieldLabel}`,
      HttpStatus.BAD_REQUEST,
    );
  }
  if (options.some((option) => typeof option !== 'string' || !option.trim())) {
    throw new HttpException(
      `Chaque option de ${fieldLabel} doit être une chaîne non vide`,
      HttpStatus.BAD_REQUEST,
    );
  }
  if (new Set(options).size !== options.length) {
    throw new HttpException(
      `${fieldLabel} ne doit pas contenir de doublons`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function validateQuestionConfig(config: {
  responseValueType: ResponseValueTypeEnum;
  options?: string[];
  responsePrecisionCondition?: string | number | null;
  precisionValueType?: ResponseValueTypeEnum | null;
  precisionOptions?: string[];
}): void {
  const options = config.options ?? [];

  if (config.responseValueType === ResponseValueTypeEnum.SINGLE_CHOICE) {
    validateOptionsList(options, 'une question de type SINGLE_CHOICE');
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

  const precisionOptions = config.precisionOptions ?? [];
  if (config.precisionValueType === ResponseValueTypeEnum.SINGLE_CHOICE) {
    validateOptionsList(
      precisionOptions,
      'une précision de type SINGLE_CHOICE (precisionOptions)',
    );
  }
}
