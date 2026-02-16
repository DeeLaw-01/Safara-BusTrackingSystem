import { create } from 'zustand';
import { authApi } from '../services/api';
import { socketService } from '../services/socket';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string; role: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login({ email, password });
      const { user, token } = data.data;
      
      localStorage.setItem('token', token);
      socketService.connect(token);
      
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: response } = await authApi.register(data);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      socketService.connect(token);
      
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    socketService.disconnect();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const { data } = await authApi.getMe();
      socketService.connect(token);
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  setToken: async (token) => {
    localStorage.setItem('token', token);
    set({ token });
    await get().checkAuth();
  },

  clearError: () => set({ error: null }),
}));
