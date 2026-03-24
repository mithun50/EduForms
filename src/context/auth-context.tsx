'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import type { Admin } from '@/types';

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  loading: boolean;
  setAdmin: (admin: Admin | null) => void;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  admin: null,
  loading: true,
  setAdmin: () => {},
  refreshAdmin: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdmin = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setAdmin(data.admin);
        return true;
      } else {
        setAdmin(null);
        return false;
      }
    } catch {
      setAdmin(null);
      return false;
    }
  }, []);

  // On mount: check session cookie first (source of truth)
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Always check the httpOnly session cookie first
      await fetchAdmin();
      if (mounted) {
        setLoading(false);
      }
    };

    init();

    // Listen for Firebase client auth changes (handles real-time sign-out)
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      // If Firebase says signed out but we have admin, re-check session
      // (user may have signed out in another tab)
      if (!firebaseUser && admin) {
        fetchAdmin();
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, admin, loading, setAdmin, refreshAdmin: fetchAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
