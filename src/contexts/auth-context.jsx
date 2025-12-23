'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export const AuthContext = createContext({
  user: null,
  status: 'loading',
  isAuthenticated: false,
  isAdmin: false,
  isStudent: false,
  isLoading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }) {
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set loading state based on the session status
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);

  const value = {
    user: session?.user || null,
    status,
    isAuthenticated: status === 'authenticated',
    isAdmin: session?.user?.role === 'ADMIN',
    isStudent: session?.user?.role === 'STUDENT',
    isLoading,
    refresh: async () => {
      await update();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
