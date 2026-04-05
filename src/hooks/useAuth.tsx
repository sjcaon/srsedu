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

    if (error) {
      console.error('Failed to fetch profile', error);
      setProfile(fallbackProfile);
      return fallbackProfile;
    }

    if (data) {
      setProfile(data);
      return data;
    }

    // Profile doesn't exist — try to create once (trigger should handle this, but fallback)
    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        user_id: sessionUser.id,
        full_name: fallbackProfile.full_name,
        email: fallbackProfile.email,
      })
      .select('full_name, email')
      .single();

    if (!createError && createdProfile) {
      setProfile(createdProfile);
      return createdProfile;
    }

    // If insert also fails (RLS), just use fallback — don't retry infinitely
    console.warn('Could not create profile, using fallback', createError?.message);
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
    // Prevent concurrent syncs
    if (syncingRef.current) return;
    syncingRef.current = true;

    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setRole(null);
      setProfile(null);
      setAccessContext({ loginId: null, isFirstLogin: false });
      setLoading(false);
      syncingRef.current = false;
      return;
    }

    try {
      await fetchUserRole(nextSession.user.id);
      await Promise.all([fetchProfile(nextSession.user), fetchAccessContext()]);
    } catch (error) {
      console.error('Failed to sync auth state', error);
      setRole(null);
      setAccessContext({ loginId: null, isFirstLogin: false });
    } finally {
      setLoading(false);
      syncingRef.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setLoading(true);
        setTimeout(() => {
          if (mounted) void syncSession(session);
        }, 0);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) void syncSession(session);
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
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
