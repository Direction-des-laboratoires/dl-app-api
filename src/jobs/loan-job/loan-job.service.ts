import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import logger from 'src/utils/logger';

@Injectable()
export class LoanJobsService {
  private readonly logger = new Logger(LoanJobsService.name);

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleLoanStatusUpdate() {
    this.logger.debug('Checking expired loans and updating status...');
    // logique métier ici
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async remindPendingPayments() {
    logger.info(`---REMIND LOAN REIMBOURSE---`);
    // logique de notification ici
  }
}
