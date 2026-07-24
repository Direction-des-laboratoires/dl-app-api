import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import logger from 'src/utils/logger';
import {
  formatPhoneForSenegalSms,
  parsePhoneNumbers,
} from 'src/utils/functions/format-senegal-phone';

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

      // Normalise Unicode (accents/composés) pour un envoi fiable
      const content = String(smsObject.content ?? '').normalize('NFC');

      const config = {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json',
          'Accept-Charset': 'utf-8',
          Token: this.promobileSmsAccessKey,
        },
        // Force l'encodage UTF-8 des query params (accents, #, @, etc.)
        paramsSerializer: (params: Record<string, string>) =>
          Object.entries(params)
            .map(
              ([key, value]) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
            )
            .join('&'),
      };

      const results = await Promise.all(
        recipients.map((recipient) => {
          const to = formatPhoneForSenegalSms(recipient);
          return this.promobileAxios.get(this.promobileSmsUrl, {
            ...config,
            params: {
              to,
              from,
              content,
              // Demande l'encodage Unicode côté passerelle si supporté
              unicode: '1',
              charset: 'utf-8',
            },
          });
        }),
      );

      return results.length === 1 ? results[0].data : results.map((r) => r.data);
    } catch (error) {
      logger.info(`---PROMOBILE SEND SMS ERROR ${error}---`);
      throw new HttpException(error.message, error.status);
    }
  }
}
