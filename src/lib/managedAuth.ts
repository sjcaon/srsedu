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
type ProvisionType = 'student' | 'teacher';

export type ProvisionResult = {
  record: any;
  loginId: string;
  loginIdLabel: string;
  defaultPassword: string;
};

/**
 * Creates the managed auth account (dummy email + default password) and the
 * student/teacher record through the privileged edge function.
 * Surfaces the real server-side error message instead of the generic
 * "Edge Function returned a non-2xx status code".
 */
export async function provisionManagedUser(
  type: ProvisionType,
  payload: Record<string, unknown>,
): Promise<ProvisionResult> {
  const { supabase } = await import('@/integrations/supabase/client');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Your session expired. Please sign in again as admin and retry.');
  }

  const { data, error } = await supabase.functions.invoke('provision-managed-user', {
    body: { type, payload },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    let message = error.message;
    const response = (error as any)?.context as Response | undefined;
    if (response && typeof response.text === 'function') {
      try {
        const body = await response.text();
        const parsed = body ? JSON.parse(body) : null;
        if (parsed?.error) message = parsed.error;
        else if (body) message = body;
      } catch {
        /* keep original message */
      }
    }
    throw new Error(message);
  }

  if (data?.error) throw new Error(data.error);
  if (!data?.record) throw new Error('The account was not saved. Please try again.');

  return data as ProvisionResult;
}
