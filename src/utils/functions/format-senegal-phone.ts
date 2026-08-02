/**
 * Nettoie un numéro : conserve uniquement les chiffres (et un éventuel "+"
 * en tête), en supprimant espaces, lettres et caractères spéciaux
 * (ex : "76 638 47 29 (num de l'hôpital)" -> "766384729").
 */
export function sanitizePhoneNumber(value: string): string {
  const hasPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Décompose une chaîne pouvant contenir plusieurs numéros séparés par "/".
 * Chaque numéro est nettoyé (lettres et caractères spéciaux supprimés).
 */
export function parsePhoneNumbers(
  value: string | null | undefined,
): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return [];
  }

  return trimmed
    .split('/')
    .map((part) => sanitizePhoneNumber(part))
    .filter((part) => part.length > 0);
}

/**
 * Aplatit une liste de numéros pouvant contenir plusieurs valeurs par entrée.
 */
export function flattenPhoneNumbers(
  values: Array<string | null | undefined>,
): string[] {
  return values.flatMap((value) => parsePhoneNumbers(value));
}

/**
 * Formate un numéro pour l'envoi SMS au Sénégal.
 * N'altère pas la valeur stockée en base : à utiliser uniquement au moment de l'envoi.
 */
export function formatPhoneForSenegalSms(phone: string): string {
  const cleaned = sanitizePhoneNumber(phone);
  if (!cleaned) {
    return cleaned;
  }

  if (cleaned.startsWith('+221')) {
    return cleaned.slice(1);
  }

  if (cleaned.startsWith('221')) {
    return cleaned;
  }

  const localNumber = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  return `221${localNumber}`;
}
