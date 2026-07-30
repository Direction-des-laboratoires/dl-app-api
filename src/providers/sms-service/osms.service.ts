import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import logger from 'src/utils/logger';
import {
  formatPhoneForSenegalSms,
  parsePhoneNumbers,
} from 'src/utils/functions/format-senegal-phone';

/**
 * Résultat unitaire renvoyé par Orange SMS Pro pour un destinataire.
 * L'API répond en JSON : { "response": [ { status_code, status_text, ... } ] }
 * (et non le format texte annoncé dans la doc).
 */
type OsmsResult = {
  status_code: number;
  status_text: string;
  message_id?: number;
  messagedetail_id?: number;
  recipient?: string;
  external_id?: string | null;
};

@Injectable()
export class OsmsSmsService {
  constructor(private configService: ConfigService) {}
  private readonly osmsAxios = axios.create();

  private get url(): string {
    return this.configService.get('osmsSmsUrl');
  }
  private get token(): string {
    return this.configService.get('osmsToken');
  }
  private get privateKey(): string {
    return this.configService.get('osmsPrivateKey');
  }
  private get signature(): string {
    return this.configService.get('osmsSignature');
  }
  private get algo(): string {
    return this.configService.get('osmsAlgo') || 'HMAC';
  }

  /**
   * Calcule la clé publique à usage unique attendue par Orange SMS Pro.
   * chaine = token + subject + signature + recipient + content + timestamp
   */
  private computeKey(
    subject: string,
    recipient: string,
    content: string,
    timestamp: string,
  ): string {
    const chaine =
      this.token + subject + this.signature + recipient + content + timestamp;

    if (this.algo.toLowerCase() === 'md5') {
      return crypto
        .createHash('md5')
        .update(chaine + this.privateKey)
        .digest('hex');
    }

    return crypto
      .createHmac('sha1', this.privateKey)
      .update(chaine)
      .digest('hex');
  }

  /**
   * Extrait le résultat unitaire de la réponse d'Orange.
   * Format réel : { "response": [ { status_code, status_text, ... } ] }.
   * Fallback texte "CLE: valeur" conservé au cas où l'API changerait.
   */
  private parseResponse(raw: unknown): OsmsResult {
    // Cas nominal : JSON { response: [ {...} ] } (déjà désérialisé par axios).
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, any>;
      const entry = Array.isArray(obj.response) ? obj.response[0] : obj;
      if (entry && entry.status_code !== undefined) {
        return {
          status_code: Number(entry.status_code),
          status_text: String(entry.status_text ?? ''),
          message_id: entry.message_id,
          messagedetail_id: entry.messagedetail_id,
          recipient: entry.recipient,
          external_id: entry.external_id ?? null,
        };
      }
    }

    // Fallback : ancien format texte "CLE: valeur" documenté.
    const text = typeof raw === 'string' ? raw : String(raw ?? '');
    const map: Record<string, string> = {};
    text.split(/\r?\n/).forEach((line) => {
      const index = line.indexOf(':');
      if (index === -1) return;
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      if (key) map[key] = value;
    });

    return {
      status_code: Number(map.STATUS_CODE),
      status_text: map.STATUS_TEXT ?? '',
      message_id: map.MESSAGE_ID ? Number(map.MESSAGE_ID) : undefined,
      messagedetail_id: map.MESSAGEDETAIL_ID
        ? Number(map.MESSAGEDETAIL_ID)
        : undefined,
      recipient: map.RECIPIENT,
    };
  }

  /**
   * Envoie un SMS via Orange SMS Pro. Un appel signé (clé publique à usage
   * unique) est effectué pour chaque destinataire.
   */
  async sendSms(smsObject: {
    to: string;
    content: string;
    subject?: string;
  }): Promise<OsmsResult | OsmsResult[]> {
    try {
      if (!this.token || !this.privateKey || !this.signature) {
        throw new HttpException(
          'Configuration Orange SMS Pro incomplète (token, clé privée ou signature)',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const recipients = parsePhoneNumbers(smsObject.to);
      if (recipients.length === 0) {
        throw new HttpException(
          'Aucun numéro de téléphone fourni',
          HttpStatus.BAD_REQUEST,
        );
      }

      const subject = String(smsObject.subject ?? 'SMS').normalize('NFC');
      // Normalise Unicode (accents/composés) pour un envoi fiable
      const content = String(smsObject.content ?? '').normalize('NFC');

      const config = {
        timeout: 20000,
        headers: {
          Accept: 'application/json',
          'Accept-Charset': 'utf-8',
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

      logger.info(
        `---OSMS SEND SMS INIT--- url=${this.url} algo=${this.algo} signature=${this.signature} recipients=${recipients.length} token=${this.mask(this.token)}`,
      );

      const responses: OsmsResult[] = [];

      // Séquentiel : chaque requête utilise un timestamp/clé publique unique.
      for (const recipient of recipients) {
        const to = formatPhoneForSenegalSms(recipient);
        // Timestamp Unix (secondes) réutilisé à l'identique dans le calcul de clé.
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const key = this.computeKey(subject, to, content, timestamp);

        logger.info(
          `---OSMS REQUEST--- recipient=${to} timestamp=${timestamp} key=${key} contentLength=${content.length}`,
        );

        const response = await this.osmsAxios.get(this.url, {
          ...config,
          params: {
            token: this.token,
            subject,
            signature: this.signature,
            recipient: to,
            content,
            timestamp,
            key,
            algo: this.algo,
          },
        });

        // Réponse brute d'Orange : indispensable pour diagnostiquer.
        logger.info(
          `---OSMS RAW RESPONSE--- recipient=${to} httpStatus=${response.status} body=${JSON.stringify(response.data)}`,
        );

        const parsed = this.parseResponse(response.data);

        if (parsed.status_code !== 200) {
          logger.error(
            `---OSMS SEND SMS FAILED--- recipient=${to} status=${parsed.status_code} text=${parsed.status_text}`,
          );
          throw new HttpException(
            `Echec envoi SMS Orange (${parsed.status_code || 'inconnu'}: ${parsed.status_text || 'erreur inconnue'})`,
            HttpStatus.BAD_GATEWAY,
          );
        }

        logger.info(
          `---OSMS SEND SMS OK--- recipient=${to} messageId=${parsed.message_id} detailId=${parsed.messagedetail_id}`,
        );
        responses.push(parsed);
      }

      return responses.length === 1 ? responses[0] : responses;
    } catch (error) {
      if (error instanceof HttpException) {
        logger.error(`---OSMS SEND SMS ERROR (métier)--- ${error.message}`);
        throw error;
      }

      // Détail des erreurs réseau/HTTP axios (timeout, DNS, refus, réponse HTTP != 2xx)
      logger.error(
        `---OSMS SEND SMS ERROR (réseau)--- code=${error?.code} message=${error?.message} httpStatus=${error?.response?.status} body=${JSON.stringify(error?.response?.data)}`,
      );
      throw new HttpException(
        error?.message || "Erreur lors de l'envoi du SMS Orange",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Masque un secret pour les logs (garde 4 premiers/derniers caractères). */
  private mask(value?: string): string {
    if (!value) {
      return '(vide)';
    }
    if (value.length <= 8) {
      return '***';
    }
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }
}
