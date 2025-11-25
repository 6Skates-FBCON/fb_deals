import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = async (userId: string) => {
    try {
      console.log('[AUTH] Checking admin status for user:', userId);
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('[AUTH] Admin check result:', { data, error });
      const isAdmin = !error && data !== null;
      console.log('[AUTH] Is admin:', isAdmin);
      return isAdmin;
    } catch (err) {
      console.error('[AUTH] Admin check exception:', err);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            const adminStatus = await checkAdminStatus(initialSession.user.id);
            setIsAdmin(adminStatus);
          } else {
            setIsAdmin(false);
          }

          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const adminStatus = await checkAdminStatus(currentSession.user.id);
          setIsAdmin(adminStatus);
        } else {
          setIsAdmin(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!initialized) {
    return null;
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
