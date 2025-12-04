import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { Session, User, AuthError } from '@supabase/supabase-js';

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

async function checkAdminStatus(userId: string): Promise<boolean> {
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
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(initialSession ?? null);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          const adminStatus = await checkAdminStatus(initialSession.user.id);
          if (mounted) setIsAdmin(adminStatus);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const adminStatus = await checkAdminStatus(currentSession.user.id);
        if (mounted) setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 🔑 IMPORTANT: do NOT block rendering here.
  // The app will render immediately; screens can use `loading`
  // if they want to show spinners.
  return (
    <AuthContext.Provider
      value={{ user, session, loading, isAdmin, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }

  async function signOut() {
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
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  // kept here in case we want a loading UI again later
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
