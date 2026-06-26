import { HttpException, HttpStatus } from '@nestjs/common';
import { Investigation } from '../interfaces/investigation.interface';
import { InvestigationStatusEnum } from 'src/utils/enums/investigation-status.enum';

export function assertInvestigationAcceptsResponses(
  investigation: Investigation,
): void {
  if (!investigation.active) {
    throw new HttpException(
      "Cette enquête n'est pas active",
      HttpStatus.BAD_REQUEST,
    );
  }

  if (investigation.status !== InvestigationStatusEnum.IN_PROGRESS) {
    throw new HttpException(
      'Les réponses ne sont acceptées que pour une enquête au statut "in_progress"',
      HttpStatus.BAD_REQUEST,
    );
  }

  const now = new Date();
  if (investigation.startDate && now < new Date(investigation.startDate)) {
    throw new HttpException(
      "Cette enquête n'a pas encore commencé",
      HttpStatus.BAD_REQUEST,
    );
  }
  if (investigation.endDate && now > new Date(investigation.endDate)) {
    throw new HttpException(
      'La période de cette enquête est terminée',
      HttpStatus.BAD_REQUEST,
    );
  }
}
