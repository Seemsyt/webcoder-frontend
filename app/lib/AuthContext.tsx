'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getToken, saveToken, saveUser, clearAuth, getUser } from './auth';
import { getMe } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const storedToken = getToken();
      const storedUser = getUser();

      if (storedToken && storedUser) {
        // Verify token is still valid by calling /me
        await getMe(storedToken);
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (error) {
      // Token is invalid or expired
      clearAuth();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    saveToken(newToken);
    saveUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
