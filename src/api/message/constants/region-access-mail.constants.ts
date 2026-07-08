export const regionAccessMailSubject =
  'Activation de vos accès - Plateforme nationale de gestion des laboratoires';

export const regionAccessSecureUrl = 'https://dirlabo.sn/fr/auth';

export const regionAccesMailContent = `Madame, Monsieur le Responsable,

Faisant suite à la communication de Monsieur le Ministre de la Santé et de l'Hygiène publique, la Direction des Laboratoires vous transmet aujourd'hui vos accès confidentiels à la nouvelle plateforme de gouvernance nationale.

Votre collaboration est la clé de voûte de ce projet stratégique, conçu pour optimiser le pilotage de nos équipements et valoriser les données de votre personnel.

Vos paramètres de connexion :`;

export const regionAccessMailFooter =
  'Veuillez vous connecter avec votre email et le mot de passe fourni, puis changer ce mot de passe lors de votre première connexion.';

type RegionAccessMailParams = {
  email: string;
  password: string;
};

export function buildRegionAccessMailHtml({
  email,
  password,
}: RegionAccessMailParams): string {
  const paragraphs = regionAccesMailContent
    .split('\n\n')
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join('');

  return `
    ${paragraphs}
    <div class="info-box">
      <p><strong>Espace sécurisé :</strong> <a href="${regionAccessSecureUrl}">${regionAccessSecureUrl}</a></p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Mot de passe temporaire :</strong> ${password}</p>
    </div>
    <p>${regionAccessMailFooter}</p>
  `;
}
