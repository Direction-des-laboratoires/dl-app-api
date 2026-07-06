import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import logger from 'src/utils/logger';
import { formatPhoneForSenegalSms, parsePhoneNumbers } from 'src/utils/functions/format-senegal-phone';

@Injectable()
export class PromobileSmsService {
  constructor(private configService: ConfigService) {}
  promobileAxios = axios.create();
  promobileSmsUrl = this.configService.get('promobileSmsUrl');
  promobileSmsAccessKey = this.configService.get('promobileSmsAccessKey');
  async sendSms(smsObject: { from?: string; to: string; content: string }) {
    try {
      const from = smsObject.from || this.configService.get('promobileSmsFrom');
      const recipients = parsePhoneNumbers(smsObject.to);

      if (recipients.length === 0) {
        throw new HttpException(
          'Aucun numéro de téléphone fourni',
          HttpStatus.BAD_REQUEST,
        );
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Token: this.promobileSmsAccessKey,
        },
      };

      const results = await Promise.all(
        recipients.map((recipient) => {
          const to = formatPhoneForSenegalSms(recipient);
          return this.promobileAxios.get(
            `${this.promobileSmsUrl}?to=${encodeURIComponent(to)}&from=${encodeURIComponent(from)}&content=${encodeURIComponent(smsObject.content)}`,
            config,
          );
        }),
      );

      return results.length === 1 ? results[0].data : results.map((r) => r.data);
    } catch (error) {
      logger.info(`---PROMOBILE SEND SMS ERROR ${error}---`)
      throw new HttpException(error.message, error.status);
    }
  }
}
