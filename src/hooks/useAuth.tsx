import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AppRole = 'admin' | 'teacher' | 'student' | 'guardian';
type UserProfile = { full_name: string; email: string | null };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

    if (error) throw error;

    if (!data) {
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

      setProfile(fallbackProfile);
      return fallbackProfile;
    }

    const needsUpdate =
      (!data.full_name && fallbackProfile.full_name) || (!data.email && fallbackProfile.email);

    if (needsUpdate) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name || fallbackProfile.full_name,
          email: data.email || fallbackProfile.email,
        })
        .eq('user_id', sessionUser.id)
        .select('full_name, email')
        .single();

      if (!updateError && updatedProfile) {
        setProfile(updatedProfile);
        return updatedProfile;
      }
    }

    setProfile(data);
    return data;
  };

  const syncSession = async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setRole(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      await Promise.all([fetchUserRole(nextSession.user.id), fetchProfile(nextSession.user)]);
    } catch (error) {
      console.error('Failed to sync auth state', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoading(true);
        setTimeout(() => {
          void syncSession(session);
        }, 0);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
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
      await Promise.all([fetchUserRole(data.session.user.id), fetchProfile(data.session.user)]);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
