/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, AdminRole } from '../types';
import { adminUserService } from './adminUserService';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  isOperator: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCurrentUser: (updates: Partial<AdminUser>) => void;
}

const STORAGE_KEY = 'iransiim_admin_auth_user';

export const DEFAULT_ACCOUNTS = [
  {
    id: 'usr-owner-1',
    username: 'owner',
    password: 'owner123',
    fullName: 'مدیر ارشد و مالک سیستم',
    role: 'Owner' as AdminRole,
    email: 'owner@iransiim.ir',
    mobile: '09365694219',
    isActive: true,
  },
  {
    id: 'usr-operator-1',
    username: 'operator',
    password: 'operator123',
    fullName: 'کارشناس ثبت و پردازش سفارشات',
    role: 'Operator' as AdminRole,
    email: 'operator@iransiim.ir',
    mobile: '09350000000',
    isActive: true,
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    // Default logged in as Owner for smooth usage unless logged out
    return {
      id: 'usr-owner-1',
      username: 'owner',
      fullName: 'مدیر ارشد و مالک سیستم',
      mobile: '09365694219',
      email: 'owner@iransiim.ir',
      role: 'Owner',
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: '1403/01/01',
    };
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise((res) => setTimeout(res, 200));
    const verifiedUser = adminUserService.verifyCredentials(username, password);

    if (verifiedUser) {
      const authUser: AdminUser = {
        ...verifiedUser,
        lastLogin: new Date().toISOString(),
      };
      setUser(authUser);
      return { success: true };
    }

    return { success: false, error: 'نام کاربری یا رمز عبور اشتباه است یا حساب غیرفعال شده است.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateCurrentUser = (updates: Partial<AdminUser>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
    }
  };

  const isOwner = user?.role === 'Owner';
  const isOperator = user?.role === 'Operator';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isOwner,
        isOperator,
        login,
        logout,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
