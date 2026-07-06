export type MessageTemplateContext = Record<string, string>;

type BuildContextOptions = {
  escapeHtml?: boolean;
};

function formatValue(
  value: unknown,
  escapeHtml: boolean,
): string {
  if (value === null || value === undefined) {
    return '';
  }

  const formatted = String(value);
  if (!escapeHtml) {
    return formatted;
  }

  return formatted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildMessageTemplateContext(
  user: Record<string, any> | null | undefined,
  options: BuildContextOptions = {},
): MessageTemplateContext {
  const escapeHtml = options.escapeHtml === true;
  const lab =
    user?.lab && typeof user.lab === 'object' ? user.lab : undefined;
  const structure =
    lab?.structure && typeof lab.structure === 'object'
      ? lab.structure
      : undefined;
  const region =
    user?.region && typeof user.region === 'object' ? user.region : undefined;
  const position =
    user?.position && typeof user.position === 'object'
      ? user.position
      : undefined;
  const environment =
    user?.environment && typeof user.environment === 'object'
      ? user.environment
      : undefined;

  const firstname = formatValue(user?.firstname, escapeHtml);
  const lastname = formatValue(user?.lastname, escapeHtml);

  return {
    firstname,
    lastname,
    fullname: formatValue(
      `${user?.firstname || ''} ${user?.lastname || ''}`.trim(),
      escapeHtml,
    ),
    email: formatValue(user?.email, escapeHtml),
    phoneNumber: formatValue(user?.phoneNumber, escapeHtml),
    phoneNumber2: formatValue(user?.phoneNumber2, escapeHtml),
    whatsappNumber: formatValue(user?.whatsappNumber, escapeHtml),
    role: formatValue(user?.role, escapeHtml),
    matricule: formatValue(user?.matricule, escapeHtml),
    gender: formatValue(user?.gender, escapeHtml),
    labName: formatValue(lab?.name, escapeHtml),
    structureName: formatValue(structure?.name, escapeHtml),
    regionName: formatValue(region?.name, escapeHtml),
    positionTitle: formatValue(position?.title, escapeHtml),
    environmentName: formatValue(environment?.name, escapeHtml),
  };
}

export function renderMessageTemplate(
  template: string,
  context: MessageTemplateContext,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    return context[key] ?? '';
  });
}

export function messageHasTemplateVariables(template: string): boolean {
  return /\{\{\s*\w+\s*\}\}/.test(template);
}
