export const regionAccessMailSubject =
  'Activation de vos accès - Plateforme nationale de gestion des laboratoires';

export const regionAccessSecureUrl = 'https://dirlabo.sn/fr/auth';

export const regionAccesMailContent = `Madame, Monsieur le Responsable du laboratoire de {{labName}},

Suite à la communication du Ministre de la Santé et de l'Hygiène publique, la Direction des Laboratoires vous transmet vos accès confidentiels à la plateforme nationale de gouvernance.

Votre collaboration est essentielle pour optimiser le pilotage de nos équipements et valoriser les données de votre personnel.

Après votre connexion, vous compléterez deux questionnaires dédiés au personnel et aux équipements de votre laboratoire.

Nous vous remercions pour votre engagement dans la modernisation de notre système de santé.

Bien cordialement,
La Direction des Laboratoires
Ministère de la Santé et de l'Hygiène publique`;

export const regionAccessMailNote =
  "Note : Si ce message vous est parvenu par erreur ou si vous n'occupez pas la fonction de responsable de laboratoire, merci de nous en informer sans délai par retour de courriel.";

type RegionAccessMailParams = {
  labName: string;
  email: string;
  password: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildRegionAccessMailText({
  labName,
  email,
  password,
}: RegionAccessMailParams): string {
  const paragraphs = [
    `Madame, Monsieur le Responsable du laboratoire de ${labName},`,
    "Suite à la communication du Ministre de la Santé et de l'Hygiène publique, la Direction des Laboratoires vous transmet vos accès confidentiels à la plateforme nationale de gouvernance.",
    'Votre collaboration est essentielle pour optimiser le pilotage de nos équipements et valoriser les données de votre personnel.',
    'Après votre connexion, vous compléterez deux questionnaires dédiés au personnel et aux équipements de votre laboratoire.',
    'Nous vous remercions pour votre engagement dans la modernisation de notre système de santé.',
    'Bien cordialement,\nLa Direction des Laboratoires\nMinistère de la Santé et de l\'Hygiène publique',
  ];

  const connectionBlock = [
    'Vos paramètres de connexion :',
    '',
    `Espace sécurisé : ${regionAccessSecureUrl}`,
    `Identifiant : ${email}`,
    `Mot de passe provisoire : ${password}`,
  ].join('\n');

  return [paragraphs.join('\n\n'), connectionBlock, regionAccessMailNote].join(
    '\n\n\n',
  );
}

export function buildRegionAccessMailHtml(
  params: RegionAccessMailParams,
): string {
  const text = buildRegionAccessMailText(params);

  return `<div style="white-space:pre-wrap;line-height:1.6;font-size:14px;font-family:Arial,sans-serif;">${escapeHtml(text)}</div>`;
}
