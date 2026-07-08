/**
 * Templates HTML pour les emails
 */

export class MailTemplates {
  /**
   * Template pour l'email de bienvenue avec accès
   */
  static welcomeEmail(
    name: string,
    password?: string,
    dashboardUrl?: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #ffffff;
          }
          .header { 
            background-color: #1565C0; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 5px 5px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content { 
            padding: 30px 20px; 
            background-color: #ffffff;
          }
          .credentials {
            background-color: #f9f9f9;
            border-left: 4px solid #1565C0;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .credentials strong {
            color: #1565C0;
          }
          .password-box {
            background-color: #fff;
            border: 2px dashed #1565C0;
            padding: 15px;
            margin: 15px 0;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            color: #333;
            border-radius: 4px;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            font-size: 12px; 
            color: #666;
            background-color: #f9f9f9;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            padding: 15px 30px;
            background-color: #1565C0;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
          }
          .button:hover {
            background-color: #0D47A1;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue !</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${name}</strong>,</p>
            <p>Votre compte a été créé avec succès dans le système de gestion de personnel des laboratoires.</p>
            ${
              password
                ? `
            <div class="credentials">
              <p><strong>Vos identifiants de connexion :</strong></p>
              <p>Vous pouvez maintenant vous connecter avec les identifiants suivants :</p>
              <div class="password-box">
                Mot de passe temporaire : <strong>${password}</strong>
              </div>
              <p style="color: #d32f2f; font-weight: bold;">⚠️ Important : Veuillez changer ce mot de passe lors de votre première connexion pour des raisons de sécurité.</p>
            </div>
            `
                : ''
            }
            ${
              dashboardUrl
                ? `
            <p style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" class="button">Accéder au dashboard</a>
            </p>
            `
                : ''
            }
            <p>Si vous avez des questions ou besoin d'assistance, n'hésitez pas à contacter l'administrateur du système.</p>
            <p>Cordialement,<br><strong>L'équipe de gestion</strong></p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p>&copy; ${new Date().getFullYear()} - Système de gestion de personnel des laboratoires</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template pour l'email de réinitialisation de mot de passe
   */
  static passwordResetEmail(
    name: string,
    resetToken: string,
    resetUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #ffffff;
          }
          .header { 
            background-color: #1565C0; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 5px 5px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content { 
            padding: 30px 20px; 
            background-color: #ffffff;
          }
          .button { 
            display: inline-block; 
            padding: 15px 30px; 
            background-color: #1565C0; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 20px 0;
            font-weight: bold;
          }
          .button:hover {
            background-color: #0D47A1;
          }
          .reset-link {
            background-color: #f9f9f9;
            border-left: 4px solid #1565C0;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            word-break: break-all;
            font-family: monospace;
            font-size: 12px;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #856404;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            font-size: 12px; 
            color: #666;
            background-color: #f9f9f9;
            border-radius: 0 0 5px 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${name}</strong>,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte.</p>
            <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </p>
            <p>Ou copiez et collez ce lien dans votre navigateur :</p>
            <div class="reset-link">
              ${resetUrl}
            </div>
            <div class="warning">
              <p><strong>⚠️ Important :</strong></p>
              <ul>
                <li>Ce lien est valide pendant <strong>1 heure</strong> uniquement.</li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</li>
                <li>Pour votre sécurité, ne partagez jamais ce lien avec quelqu'un d'autre.</li>
              </ul>
            </div>
            <p>Si vous avez des questions ou besoin d'assistance, n'hésitez pas à contacter l'administrateur du système.</p>
            <p>Cordialement,<br><strong>L'équipe de gestion</strong></p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p>&copy; ${new Date().getFullYear()} - Système de gestion de personnel des laboratoires</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template générique pour un email personnalisé
   */
  static genericEmail(
    title: string,
    content: string,
    buttonText?: string,
    buttonUrl?: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #eef2f7;
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1f2937;
            line-height: 1.7;
            -webkit-font-smoothing: antialiased;
          }
          .email-wrapper {
            width: 100%;
            padding: 32px 16px;
            box-sizing: border-box;
          }
          .email-card {
            max-width: 640px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          }
          .email-accent {
            height: 4px;
            background: linear-gradient(90deg, #1565C0 0%, #42a5f5 100%);
          }
          .email-body {
            padding: 32px 28px;
            font-size: 15px;
          }
          .email-body p {
            margin: 0 0 16px 0;
            color: #374151;
          }
          .email-body p:last-child {
            margin-bottom: 0;
          }
          .email-body strong {
            color: #111827;
            font-weight: 600;
          }
          .email-body a {
            color: #1565C0;
            text-decoration: none;
            font-weight: 500;
          }
          .email-body a:hover {
            text-decoration: underline;
          }
          .email-body ul,
          .email-body ol {
            margin: 0 0 16px 0;
            padding-left: 22px;
            color: #374151;
          }
          .email-body li {
            margin-bottom: 8px;
          }
          .email-body h1,
          .email-body h2,
          .email-body h3 {
            margin: 0 0 12px 0;
            color: #111827;
            line-height: 1.4;
          }
          .email-body h2 {
            font-size: 20px;
          }
          .email-body h3 {
            font-size: 17px;
          }
          .info-box {
            background-color: #f8fafc;
            border: 1px solid #dbeafe;
            border-left: 4px solid #1565C0;
            border-radius: 8px;
            padding: 18px 20px;
            margin: 24px 0;
          }
          .info-box p {
            margin: 0 0 10px 0;
          }
          .info-box p:last-child {
            margin-bottom: 0;
          }
          .info-box strong {
            color: #1565C0;
          }
          .button-wrapper {
            text-align: center;
            margin: 28px 0 8px;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #1565C0;
            color: #ffffff !important;
            text-decoration: none !important;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            box-shadow: 0 4px 12px rgba(21, 101, 192, 0.25);
          }
          .button:hover {
            background-color: #0d47a1;
          }
          @media only screen and (max-width: 600px) {
            .email-wrapper {
              padding: 16px 10px;
            }
            .email-body {
              padding: 24px 18px;
              font-size: 14px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-card">
            <div class="email-accent"></div>
            <div class="email-body">
              ${content}
              ${
                buttonText && buttonUrl
                  ? `<div class="button-wrapper">
                      <a href="${buttonUrl}" class="button">${buttonText}</a>
                    </div>`
                  : ''
              }
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template pour l'email de code OTP de réinitialisation de mot de passe
   */
  static passwordResetOtp(code: string, name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #ffffff;
          }
          .header { 
            background-color: #1565C0; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 5px 5px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content { 
            padding: 30px 20px; 
            background-color: #ffffff;
          }
          .otp-code {
            background-color: #f0f0f0;
            border: 2px dashed #1565C0;
            padding: 20px;
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            color: #1565C0;
            letter-spacing: 8px;
            margin: 30px 0;
            border-radius: 5px;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            font-size: 12px; 
            color: #666;
            background-color: #f9f9f9;
            border-radius: 0 0 5px 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <p>Bonjour ${name},</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe. Utilisez le code suivant pour procéder :</p>
            
            <div class="otp-code">${code}</div>
            
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Ce code est valide pendant <strong>15 minutes</strong> uniquement</li>
                <li>Ne partagez jamais ce code avec personne</li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
              </ul>
            </div>
            
            <p>Cordialement,<br><strong>L'équipe de gestion</strong></p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p>&copy; ${new Date().getFullYear()} - Système de gestion de personnel des laboratoires</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
