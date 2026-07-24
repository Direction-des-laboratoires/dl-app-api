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

  /**
   * Template pour le mail de résultat d'un envoi d'accès différé
   */
  static accessJobResultEmail(params: {
    jobLabel: string;
    success: boolean;
    error?: string;
    summary?: {
      totalFound?: number;
      totalTargeted?: number;
      sent?: number;
      failed?: number;
      skipped?: number;
      notFound?: number;
      canal?: string;
    };
    sent?: Array<{ email?: string; phoneNumber?: string; channels?: string[] }>;
    failed?: Array<{ email?: string; phoneNumber?: string; error?: string }>;
  }): string {
    const {
      jobLabel,
      success,
      error,
      summary = {},
      sent = [],
      failed = [],
    } = params;

    const statusColor = success ? '#059669' : '#dc2626';
    const statusBg = success ? '#ecfdf5' : '#fef2f2';
    const statusBorder = success ? '#a7f3d0' : '#fecaca';
    const statusLabel = success ? 'Terminé avec succès' : 'Échec du traitement';
    const accent = success
      ? 'linear-gradient(90deg, #059669 0%, #34d399 100%)'
      : 'linear-gradient(90deg, #dc2626 0%, #f87171 100%)';

    const escape = (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const statCard = (label: string, value: number | string, color: string) => `
      <td style="width:33%;padding:6px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 10px;text-align:center;">
          <div style="font-size:22px;font-weight:700;color:${color};line-height:1.2;">${escape(value)}</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">${escape(label)}</div>
        </div>
      </td>
    `;

    const sentPreview = sent
      .slice(0, 15)
      .map((item) => {
        const contact = item.email || item.phoneNumber || '—';
        const channels = (item.channels || []).join(', ') || '—';
        return `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #eef2f7;font-size:13px;color:#334155;">${escape(contact)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eef2f7;font-size:12px;color:#64748b;">${escape(channels)}</td>
        </tr>`;
      })
      .join('');

    const failedPreview = failed
      .slice(0, 15)
      .map((item) => {
        const contact = item.email || item.phoneNumber || '—';
        return `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #fee2e2;font-size:13px;color:#334155;">${escape(contact)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #fee2e2;font-size:12px;color:#b91c1c;">${escape(item.error || 'Erreur')}</td>
        </tr>`;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#eef2f7;font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;">
        <div style="width:100%;padding:32px 16px;box-sizing:border-box;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
            <div style="height:4px;background:${accent};"></div>

            <div style="background:#0f172a;padding:22px 28px;">
              <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">Direction des Laboratoires</div>
              <div style="font-size:20px;font-weight:700;color:#ffffff;">Résultat d'envoi des accès</div>
            </div>

            <div style="padding:28px;">
              <div style="display:inline-block;background:${statusBg};border:1px solid ${statusBorder};color:${statusColor};border-radius:999px;padding:6px 14px;font-size:13px;font-weight:600;margin-bottom:18px;">
                ${statusLabel}
              </div>

              <p style="margin:0 0 8px 0;font-size:15px;color:#334155;">
                Traitement : <strong style="color:#0f172a;">${escape(jobLabel)}</strong>
              </p>
              ${
                summary.canal
                  ? `<p style="margin:0 0 20px 0;font-size:14px;color:#64748b;">Canal : <strong style="color:#1565C0;">${escape(summary.canal)}</strong></p>`
                  : '<div style="height:12px;"></div>'
              }

              ${
                success
                  ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:8px 0 24px;">
                <tr>
                  ${statCard('Trouvés', summary.totalFound ?? 0, '#1565C0')}
                  ${statCard('Ciblés', summary.totalTargeted ?? 0, '#0f766e')}
                  ${statCard('Envoyés', summary.sent ?? 0, '#059669')}
                </tr>
                <tr>
                  ${statCard('Échoués', summary.failed ?? 0, '#dc2626')}
                  ${statCard('Exclus', summary.skipped ?? 0, '#d97706')}
                  ${statCard('Introuvables', summary.notFound ?? 0, '#7c3aed')}
                </tr>
              </table>

              ${
                sent.length > 0
                  ? `
              <div style="margin-bottom:22px;">
                <h3 style="margin:0 0 10px 0;font-size:15px;color:#0f172a;">Envois réussis ${sent.length > 15 ? `(aperçu 15/${sent.length})` : ''}</h3>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                  <tr style="background:#f8fafc;">
                    <th align="left" style="padding:8px 10px;font-size:12px;color:#64748b;border-bottom:1px solid #e2e8f0;">Contact</th>
                    <th align="left" style="padding:8px 10px;font-size:12px;color:#64748b;border-bottom:1px solid #e2e8f0;">Canaux</th>
                  </tr>
                  ${sentPreview}
                </table>
              </div>`
                  : ''
              }

              ${
                failed.length > 0
                  ? `
              <div style="margin-bottom:8px;">
                <h3 style="margin:0 0 10px 0;font-size:15px;color:#0f172a;">Échecs ${failed.length > 15 ? `(aperçu 15/${failed.length})` : ''}</h3>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #fecaca;border-radius:8px;overflow:hidden;">
                  <tr style="background:#fef2f2;">
                    <th align="left" style="padding:8px 10px;font-size:12px;color:#b91c1c;border-bottom:1px solid #fecaca;">Contact</th>
                    <th align="left" style="padding:8px 10px;font-size:12px;color:#b91c1c;border-bottom:1px solid #fecaca;">Erreur</th>
                  </tr>
                  ${failedPreview}
                </table>
              </div>`
                  : ''
              }
              `
                  : `
              <div style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #dc2626;border-radius:8px;padding:16px 18px;margin-top:8px;">
                <p style="margin:0 0 6px 0;font-size:13px;font-weight:600;color:#b91c1c;">Détail de l'erreur</p>
                <p style="margin:0;font-size:14px;color:#7f1d1d;white-space:pre-wrap;">${escape(error || 'Erreur inconnue')}</p>
              </div>
              `
              }
            </div>

            <div style="padding:16px 28px 22px;background:#f8fafc;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                Email automatique DirLabo — ${new Date().toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
