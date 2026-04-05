const MANAGED_AUTH_DOMAIN = 'srs.dummy.com';

export function normalizeManagedIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

export function buildManagedAuthEmail(identifier: string) {
  return `${normalizeManagedIdentifier(identifier)}@${MANAGED_AUTH_DOMAIN}`;
}

export function resolveAdminLoginEmail(identifier: string) {
  const normalized = identifier.trim();

  if (!normalized) return normalized;
  if (normalized.toLowerCase() === 'admin') return 'siamhosain720@gmail.com';

  return normalized;
}