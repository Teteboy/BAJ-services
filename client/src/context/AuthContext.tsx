import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '@/types';
import api, { getErrorMessage } from '@/lib/api';
import { useToast } from './ToastContext';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('baj_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get<{ data: User }>('/auth/me');
      setUser(res.data.data);
    } catch {
      localStorage.removeItem('baj_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await api.post<{ token: string; user: User }>('/auth/login', {
          email,
          password,
        });
        localStorage.setItem('baj_token', res.data.token);
        setUser(res.data.user);
        showToast(`Welcome back, ${res.data.user.name}`, 'success');
        window.location.href = res.data.user.role === 'CLIENT' ? '/app/client' : '/app';
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
        throw err;
      }
    },
    [showToast]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('baj_token');
    setUser(null);
    window.location.href = '/';
  }, []);

  const hasRole = useCallback(
    (role: UserRole) => {
      return user?.role === role;
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
