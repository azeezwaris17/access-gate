// lib/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Admin {
  id: string;
  fullName: string;
  email: string;
  role?: string;
  permissions?: string[];
}

interface AuthState {
  token: string | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number;
  
  // Actions
  setAuth: (token: string, admin: any) => void;
  clearAuth: () => void;
  updateActivity: () => void;
  checkSession: () => boolean;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      admin: null,
      isAuthenticated: false,
      isLoading: true,
      lastActivity: Date.now(),

      setAuth: (token: string, admin: any) => {
        set({ 
          token, 
          admin,
          isAuthenticated: true,
          isLoading: false,
          lastActivity: Date.now()
        });
      },

      clearAuth: () => {
        set({ 
          token: null, 
          admin: null, 
          isAuthenticated: false,
          isLoading: false 
        });
      },

      updateActivity: () => {
        set({ lastActivity: Date.now() });
      },

      checkSession: () => {
        const { lastActivity } = get();
        const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
        
        if (Date.now() - lastActivity > SESSION_TIMEOUT) {
          get().clearAuth();
          return false;
        }
        
        get().updateActivity();
        return true;
      },

      initialize: () => {
        // This will be called after rehydration
        const state = get();
        if (state.token && state.admin) {
          set({ 
            isAuthenticated: true,
            isLoading: false 
          });
        } else {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initialize();
        }
      },
    }
  )
);