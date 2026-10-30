import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from './authService';
import type { User } from './authService';

type AuthContextValue = {
  user: User | null;
  signIn: (identifier: string, password: string, remember: boolean) => Promise<void>;
  /** `reason: 'expired'` shows the Figma "Session Expired" message on the sign-in screen. */
  signOut: (reason?: 'expired') => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = 'hub360.session';

function loadSession(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadSession);
  const navigate = useNavigate();

  const signIn = useCallback(async (identifier: string, password: string, remember: boolean) => {
    const signedIn = await authService.signIn(identifier, password);
    authService.rememberedIdentifier.set(remember ? identifier.trim() : null);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(signedIn));
    } catch {
      /* session survives only in memory */
    }
    setUser(signedIn);
  }, []);

  const signOut = useCallback(
    (reason?: 'expired') => {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {
        /* nothing stored */
      }
      setUser(null);
      navigate(reason ? `/sign-in?reason=${reason}` : '/sign-in', { replace: true });
    },
    [navigate],
  );

  // Sign out after SESSION_TIMEOUT_MS without pointer or keyboard activity.
  useEffect(() => {
    if (!user) return;
    let timer = window.setTimeout(() => signOut('expired'), authService.SESSION_TIMEOUT_MS);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => signOut('expired'), authService.SESSION_TIMEOUT_MS);
    };
    const events = ['pointerdown', 'keydown'] as const;
    events.forEach(e => window.addEventListener(e, reset));
    return () => {
      window.clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [user, signOut]);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
