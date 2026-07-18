'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';
import { Employee, Role } from './types';

interface AuthContextValue {
  user: Employee | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Employee>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    // Skip the /auth/me probe when there's no stored session — avoids a noisy
    // 401 in the console on every visit to the login page.
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('ems_token');
    if (!hasToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      if (typeof window !== 'undefined') localStorage.removeItem('ems_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string): Promise<Employee> => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('ems_token', data.token);
    }
    setUser(data.user);
    return data.user as Employee;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      if (typeof window !== 'undefined') localStorage.removeItem('ems_token');
      setUser(null);
      router.push('/login');
    }
  };

  const hasRole = (...roles: Role[]) => (user ? roles.includes(user.role) : false);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
