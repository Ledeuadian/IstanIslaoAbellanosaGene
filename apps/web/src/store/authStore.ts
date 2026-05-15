// ===========================================
// AUTH STORE (Zustand)
// ===========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@tree/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  
  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,

      login: (token, user) => set({
        token,
        user,
        isAuthenticated: true,
        isAdmin: user.role?.toLowerCase() === 'admin',
      }),

      logout: () => set({
        token: null,
        user: null,
        isAuthenticated: false,
        isAdmin: false,
      }),

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role?.toLowerCase() === 'admin',
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
);