'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authService } from '@/services/api';

interface User {
  employee_id: string;
  username: string;
  role: string;
  email?: string | null;
}

interface AuthContextType {
  user: User | null;
  activeRole: string | null;
  login: (employeeId: string, password: string, rememberMe?: boolean) => Promise<any>;
  logout: () => Promise<void>;
  switchRole: (role: string) => void;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setActiveRole(parsed.role);
    }
    setIsLoading(false);
  }, []);

  const login = async (employeeId: string, password: string, rememberMe?: boolean) => {
    setIsLoading(true);
    try {
      const data = await authService.login(employeeId, password, rememberMe);
      // Fetch profile to load email
      const profile = await authService.getProfile();
      const loggedUser = {
        employee_id: profile.employee_id,
        username: profile.username,
        role: profile.role,
        email: profile.email
      };
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      setActiveRole(loggedUser.role);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (e) {
      console.error("Logout API failed, forcing local cleanup", e);
    } finally {
      setUser(null);
      setActiveRole(null);
      setIsLoading(false);
      window.location.href = '/';
    }
  };

  const switchRole = (role: string) => {
    setActiveRole(role);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, activeRole, login, logout, switchRole, isLoading, setUser }}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
