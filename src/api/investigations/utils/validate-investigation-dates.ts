import { HttpException, HttpStatus } from '@nestjs/common';

export function validateInvestigationDates(
  startDate?: Date | string | null,
  endDate?: Date | string | null,
): void {
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    throw new HttpException(
      'La date de fin doit être postérieure ou égale à la date de début',
      HttpStatus.BAD_REQUEST,
    );
  }
}
