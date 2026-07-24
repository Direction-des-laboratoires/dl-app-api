export const regionAccessMailSubject =
  'Activation de vos accès - Plateforme nationale de gestion des laboratoires';

export const regionAccessSecureUrl = 'https://dirlabo.sn/fr/auth';

export const regionAccesMailContent = `Madame, Monsieur le Responsable du laboratoire de {{labName}},

Suite à la communication du Ministre de la Santé et de l'Hygiène publique, la Direction des Laboratoires vous transmet vos accès confidentiels à la plateforme nationale de gouvernance.

Votre collaboration est essentielle pour optimiser le pilotage de nos équipements et valoriser les données de votre personnel.

Après votre connexion, vous compléterez deux questionnaires dédiés au personnel et aux équipements de votre laboratoire.

Nous vous remercions pour votre engagement dans la modernisation de notre système de santé.`;

export const regionAccessMailNote =
  "Note : Si ce message vous est parvenu par erreur ou si vous n'occupez pas la fonction de responsable de laboratoire, merci de nous en informer sans délai par retour de courriel.";

export const regionAccessSmsContent = `Madame, Monsieur le Responsable du laboratoire de {{labName}}, voici vos accès dirlabo.sn
email:{{email}}
mot de passe temporaire:{{password}}`;

export const ACCESS_RESULT_NOTIFICATION_EMAILS = [
  'ndongbabacar100@gmail.com',
  'passane98@gmail.com',
];

type RegionAccessMailParams = {
  labName: string;
  email: string;
  password: string;
};

export function buildRegionAccessSmsText(params: {
  labName?: string;
  email: string;
  password: string;
  firstname?: string;
  lastname?: string;
}): string {
  return regionAccessSmsContent
    .replace(/\{\{\s*labName\s*\}\}/g, params.labName || 'votre laboratoire')
    .replace(/\{\{\s*email\s*\}\}/g, params.email)
    .replace(/\{\{\s*password\s*\}\}/g, params.password)
    .replace(/\{\{\s*firstname\s*\}\}/gi, params.firstname || '')
    .replace(/\{\{\s*lastname\s*\}\}/gi, params.lastname || '')
    .replace(/\{\{\s*firstName\s*\}\}/g, params.firstname || '')
    .replace(/\{\{\s*lastName\s*\}\}/g, params.lastname || '');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildRegionAccessMailSections({
  labName,
  email,
  password,
}: RegionAccessMailParams) {
  const bodyParagraphs = [
    `Madame, Monsieur le Responsable du laboratoire de ${labName},`,
    "Suite à la communication du Ministre de la Santé et de l'Hygiène publique, la Direction des Laboratoires vous transmet vos accès confidentiels à la plateforme nationale de gouvernance.",
    'Votre collaboration est essentielle pour optimiser le pilotage de nos équipements et valoriser les données de votre personnel.',
    'Après votre connexion, vous compléterez deux questionnaires dédiés au personnel et aux équipements de votre laboratoire.',
    'Nous vous remercions pour votre engagement dans la modernisation de notre système de santé.',
  ];

  const connectionBlock = [
    'Vos paramètres de connexion :',
    '',
    `Espace sécurisé : ${regionAccessSecureUrl}`,
    `Identifiant : ${email}`,
    `Mot de passe provisoire : ${password}`,
  ].join('\n');

  const signatureBlock =
    "Bien cordialement,\nLa Direction des Laboratoires\nMinistère de la Santé et de l'Hygiène publique";

  return { bodyParagraphs, connectionBlock, signatureBlock };
}

export function buildRegionAccessMailText(
  params: RegionAccessMailParams,
): string {
  const { bodyParagraphs, connectionBlock, signatureBlock } =
    buildRegionAccessMailSections(params);

  return [
    bodyParagraphs.join('\n\n'),
    connectionBlock,
    regionAccessMailNote,
    signatureBlock,
  ].join('\n\n\n');
}

export function buildRegionAccessMailHtml(
  params: RegionAccessMailParams,
): string {
  const { bodyParagraphs, connectionBlock, signatureBlock } =
    buildRegionAccessMailSections(params);

  const sections = [
    escapeHtml(bodyParagraphs.join('\n\n')),
    escapeHtml(connectionBlock),
    `<strong>${escapeHtml(regionAccessMailNote)}</strong>`,
    escapeHtml(signatureBlock),
  ];

  return `<div style="white-space:pre-wrap;line-height:1.6;font-size:14px;font-family:Arial,sans-serif;">${sections.join('\n\n\n')}</div>`;
}
