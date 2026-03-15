import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import logger from 'src/utils/logger';
import { MailTemplates } from './mail.templates';

import * as nodemailer from 'nodemailer';

export interface MailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
    contentType?: string;
  }>;
}

@Injectable()
export class MailService {
  private transporter: any;

  constructor(private configService: ConfigService) {
    const port = this.configService.get<number>('MAIL_PORT');

    // Déterminer automatiquement 'secure' en fonction du port si non spécifié
    // Port 465 = SSL direct (secure: true)
    // Port 587 = STARTTLS (secure: false)
    // Autres ports = utiliser la valeur de MAIL_SECURE
    const secure = false; //secureFromEnv || false;

    const mailConfig = {
      host: this.configService.get<string>('MAIL_HOST'),
      port: port,
      secure: secure, // true pour 465 (SSL), false pour 587 (STARTTLS)
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
      tls: {
        // Ne pas rejeter les certificats non autorisés (pour les serveurs de test)
        rejectUnauthorized: false,
        // Forcer TLS v1.2 ou supérieur pour éviter les problèmes de version
        minVersion: 'TLSv1.2',
      },
      // Options supplémentaires pour améliorer la compatibilité
      requireTLS: port === 587, // Require TLS pour le port 587
      connectionTimeout: 5000, // Timeout de connexion
      greetingTimeout: 5000, // Timeout de salutation
    };

    logger.info(
      `---MAIL.SERVICE.CONFIG--- host=${mailConfig.host}, port=${mailConfig.port}, secure=${mailConfig.secure}, requireTLS=${mailConfig.requireTLS}`,
    );

    this.transporter = nodemailer.createTransport(mailConfig);
  }

  /**
   * Envoie un email
   */
  async sendMail(options: MailOptions): Promise<void> {
    try {
      logger.info(
        `---MAIL.SERVICE.SEND_MAIL INIT--- to=${
          Array.isArray(options.to) ? options.to.join(',') : options.to
        }`,
      );

      const mailOptions = {
        from:
          this.configService.get<string>('MAIL_FROM') ||
          this.configService.get<string>('MAIL_USER'),
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.join(',')
            : options.cc
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.join(',')
            : options.bcc
          : undefined,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(
        `---MAIL.SERVICE.SEND_MAIL SUCCESS--- messageId=${info.messageId}`,
      );
    } catch (error) {
      logger.error(`---MAIL.SERVICE.SEND_MAIL ERROR--- ${error.message}`);
      throw error;
    }
  }

  /**
   * Vérifie la connexion au serveur mail
   */
  async verifyConnection(): Promise<boolean> {
    try {
      logger.info('---MAIL.SERVICE.VERIFY_CONNECTION INIT---');
      await this.transporter.verify();
      logger.info('---MAIL.SERVICE.VERIFY_CONNECTION SUCCESS---');
      return true;
    } catch (error) {
      logger.error(
        `---MAIL.SERVICE.VERIFY_CONNECTION ERROR--- ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Envoie un email de bienvenue
   */
  async sendWelcomeEmail(
    to: string,
    name: string,
    password?: string,
  ): Promise<void> {
    const dashboardUrl = this.configService.get<string>('FRONTEND_URL');
    const html = MailTemplates.welcomeEmail(name, password, dashboardUrl);

    await this.sendMail({
      to,
      subject: 'Bienvenue - Création de compte',
      html,
    });
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string,
    resetUrl: string,
  ): Promise<void> {
    const html = MailTemplates.passwordResetEmail(name, resetToken, resetUrl);

    await this.sendMail({
      to,
      subject: 'Réinitialisation de mot de passe',
      html,
    });
  }
}
