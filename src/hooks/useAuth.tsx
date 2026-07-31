import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { buildManagedAuthEmail, resolveAdminLoginEmail } from '@/lib/managedAuth';

type AppRole = 'admin' | 'teacher' | 'student' | 'guardian';
type UserProfile = { full_name: string; email: string | null };
type AuthLoginType = 'admin' | 'teacher' | 'student';
type AccessContext = { loginId: string | null; isFirstLogin: boolean };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: UserProfile | null;
  accessContext: AccessContext;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithIdentifier: (identifier: string, password: string, loginType: AuthLoginType) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccessContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accessContext, setAccessContext] = useState<AccessContext>({ loginId: null, isFirstLogin: false });
  const [loading, setLoading] = useState(true);
  const syncingRef = useRef(false);
  // Tracks the user id whose profile/role/context has already been hydrated so
  // token refreshes and duplicate auth events never re-trigger backend calls.
  const hydratedUserRef = useRef<string | null>(null);

  const fetchUserRole = async (userId: string) => {
    const { data: existingRole, error } = await supabase.rpc('get_user_role', { _user_id: userId });
    if (error) throw error;

    if (existingRole) {
      setRole(existingRole as AppRole);
      return existingRole as AppRole;
    }

    const { data: bootstrappedRole, error: bootstrapError } = await supabase.rpc('bootstrap_first_admin', {
      _user_id: userId,
    });

    if (bootstrapError) throw bootstrapError;

    setRole((bootstrappedRole as AppRole | null) ?? null);
    return (bootstrappedRole as AppRole | null) ?? null;
  };

  const fetchProfile = async (sessionUser: User) => {
    const fallbackProfile: UserProfile = {
      full_name: (sessionUser.user_metadata?.full_name as string | undefined) ?? '',
      email: sessionUser.email ?? null,
    };

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', sessionUser.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
      return data;
    }

    if (error) console.error('Failed to fetch profile', error);

    // Profile row missing (or unreadable) — create/repair it through a secure
    // server-side upsert instead of a direct insert that RLS can reject.
    const { data: ensured, error: ensureError } = await supabase.rpc('ensure_own_profile', {
      _full_name: fallbackProfile.full_name,
      _email: fallbackProfile.email,
    });

    const ensuredRow = Array.isArray(ensured) ? ensured[0] : null;
    if (!ensureError && ensuredRow) {
      const nextProfile = { full_name: ensuredRow.full_name, email: ensuredRow.email };
      setProfile(nextProfile);
      return nextProfile;
    }

    console.warn('Could not ensure profile, using fallback', ensureError?.message);
    setProfile(fallbackProfile);
    return fallbackProfile;
  };

  const fetchAccessContext = async () => {
    const { data, error } = await supabase.rpc('get_current_user_access_context');

    if (error) {
      console.error('Failed to fetch access context', error);
      setAccessContext({ loginId: null, isFirstLogin: false });
      return { loginId: null, isFirstLogin: false };
    }

    const context = Array.isArray(data) ? data[0] : null;
    const nextContext = {
      loginId: context?.login_id ?? null,
      isFirstLogin: context?.is_first_login ?? false,
    };

    setAccessContext(nextContext);
    return nextContext;
  };

  const syncSession = async (nextSession: Session | null) => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      hydratedUserRef.current = null;
      setRole(null);
      setProfile(null);
      setAccessContext({ loginId: null, isFirstLogin: false });
      setLoading(false);
      syncingRef.current = false;
      return;
    }

    // Same user already hydrated (e.g. token refresh) — no backend round-trips.
    if (hydratedUserRef.current === nextSession.user.id) {
      setLoading(false);
      syncingRef.current = false;
      return;
    }

    try {
      await fetchUserRole(nextSession.user.id);
      await Promise.all([fetchProfile(nextSession.user), fetchAccessContext()]);
      hydratedUserRef.current = nextSession.user.id;
    } catch (error) {
      console.error('Failed to sync auth state', error);
      hydratedUserRef.current = null;
      setRole(null);
      setAccessContext({ loginId: null, isFirstLogin: false });
    } finally {
      setLoading(false);
      syncingRef.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      // Token refreshes only rotate the JWT — update it in place, never refetch.
      if (event === 'TOKEN_REFRESHED' && nextSession?.user?.id === hydratedUserRef.current) {
        setSession(nextSession);
        setUser(nextSession.user);
        return;
      }

      if (nextSession?.user?.id && hydratedUserRef.current === nextSession.user.id) {
        setSession(nextSession);
        setUser(nextSession.user);
        setLoading(false);
        return;
      }

      setLoading(true);
      setTimeout(() => {
        if (mounted) void syncSession(nextSession);
      }, 0);
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (mounted) void syncSession(initialSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithIdentifier = async (identifier: string, password: string, loginType: AuthLoginType) => {
    const email = loginType === 'admin'
      ? resolveAdminLoginEmail(identifier)
      : buildManagedAuthEmail(identifier);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;

    if (data.session?.user) {
      await fetchUserRole(data.session.user.id);
      await Promise.all([fetchProfile(data.session.user), fetchAccessContext()]);
      hydratedUserRef.current = data.session.user.id;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    hydratedUserRef.current = null;
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
    setAccessContext({ loginId: null, isFirstLogin: false });
  };

  const refreshAccessContext = async () => {
    await fetchAccessContext();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, profile, accessContext, loading, signIn, signInWithIdentifier, signUp, signOut, refreshAccessContext }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
