import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type RequestBody = {
  type: 'student' | 'teacher';
  payload: Record<string, unknown>;
};

const DUMMY_DOMAIN = 'srs.dummy.com';
const DEFAULT_PASSWORD = '123456';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const authHeader = req.headers.get('Authorization');

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Backend secrets are missing.' }, 500);
    }

    if (!authHeader) {
      return json({ error: 'Missing authorization header.' }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(token);

    if (userError || !user) {
      return json({ error: 'Unauthorized request.' }, 401);
    }

    const { data: adminRole, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      return json({ error: 'Only admins can create managed accounts.' }, 403);
    }

    const { type, payload } = (await req.json()) as RequestBody;

    if (!type || (type !== 'student' && type !== 'teacher')) {
      return json({ error: 'Invalid account type.' }, 400);
    }

    const fullName = String(payload.full_name ?? '').trim();
    if (!fullName) {
      return json({ error: 'Full name is required.' }, 400);
    }

    const idRpc = type === 'student' ? 'next_student_login_id' : 'next_teacher_login_id';
    const idField = type === 'student' ? 'roll_number' : 'nid';
    const table = type === 'student' ? 'students' : 'teachers';
    const loginIdLabel = type === 'student' ? 'student_id' : 'teacher_id';

    const { data: loginId, error: idError } = await adminClient.rpc(idRpc);
    if (idError || !loginId) {
      return json({ error: idError?.message ?? 'Unable to generate a login ID.' }, 500);
    }

    const managedEmail = `${String(loginId).trim().toLowerCase()}@${DUMMY_DOMAIN}`;

    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: managedEmail,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        managed_login_id: loginId,
        managed_account_type: type,
      },
    });

    if (authError || !authUser.user) {
      return json({ error: authError?.message ?? 'Unable to create the auth account.' }, 500);
    }

    try {
      const recordPayload = {
        ...payload,
        user_id: authUser.user.id,
        [idField]: loginId,
        is_first_login: true,
      };

      const { data: record, error: recordError } = await adminClient
        .from(table)
        .insert(recordPayload)
        .select('*')
        .single();

      if (recordError || !record) {
        throw new Error(recordError?.message ?? 'Unable to save the account record.');
      }

      const { error: profileError } = await adminClient.from('profiles').upsert(
        {
          user_id: authUser.user.id,
          full_name: fullName,
          email: typeof payload.email === 'string' && payload.email.trim() ? payload.email.trim() : null,
        },
        { onConflict: 'user_id' },
      );

      if (profileError) throw new Error(profileError.message);

      const { error: roleInsertError } = await adminClient.from('user_roles').upsert(
        { user_id: authUser.user.id, role: type },
        { onConflict: 'user_id' },
      );

      if (roleInsertError) throw new Error(roleInsertError.message);

      return json({
        record,
        loginId,
        loginIdLabel,
        defaultPassword: DEFAULT_PASSWORD,
      });
    } catch (innerError: any) {
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      return json({ error: innerError.message ?? 'Unable to provision account.' }, 500);
    }
  } catch (error: any) {
    return json({ error: error.message ?? 'Unexpected error.' }, 500);
  }
});