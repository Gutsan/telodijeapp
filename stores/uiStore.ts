import { create } from 'zustand';

interface UIState {
  isOnline: boolean;
  theme: 'light' | 'dark' | 'system';
  setOnline: (online: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>((set) => ({
  isOnline: true,
  theme: 'system',
  setOnline: (online) => set({ isOnline: online }),
  setTheme: (theme) => set({ theme }),
}));
