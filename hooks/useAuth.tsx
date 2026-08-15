import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { startSupabaseAutoRefresh, supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  /** True until the persisted session has been read from storage. */
  initialising: boolean;
};

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  initialising: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    let active = true;

    // Reading the persisted session is async. Until it resolves we cannot tell
    // a logged-out user from a logged-in one, and routing on that guess is what
    // makes apps flash the login screen on every cold start.
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setInitialising(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setInitialising(false);
    });

    startSupabaseAutoRefresh();

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({ session, user: session?.user ?? null, initialising }),
    [session, initialising],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/**
 * For code paths that only run behind the auth gate and would otherwise need a
 * null check on every query. If this throws, a screen escaped the gate.
 */
export function useUserId(): string {
  const { user } = useAuth();
  if (!user) throw new Error('useUserId llamado fuera de una sesión autenticada');
  return user.id;
}
