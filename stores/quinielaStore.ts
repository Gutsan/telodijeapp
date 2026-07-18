import { create } from 'zustand';
import type { QuinielaWithPlayers } from '../types';

interface QuinielaState {
  quinielas: QuinielaWithPlayers[];
  selectedQuiniela: QuinielaWithPlayers | null;
  loading: boolean;
  setQuinielas: (quinielas: QuinielaWithPlayers[]) => void;
  setSelectedQuiniela: (quiniela: QuinielaWithPlayers | null) => void;
  addQuiniela: (quiniela: QuinielaWithPlayers) => void;
  updateQuiniela: (id: string, updates: Partial<QuinielaWithPlayers>) => void;
  removeQuiniela: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useQuinielaStore = create<QuinielaState>((set) => ({
  quinielas: [],
  selectedQuiniela: null,
  loading: false,
  setQuinielas: (quinielas) => set({ quinielas }),
  setSelectedQuiniela: (quiniela) => set({ selectedQuiniela: quiniela }),
  addQuiniela: (quiniela) =>
    set((state) => ({ quinielas: [...state.quinielas, quiniela] })),
  updateQuiniela: (id, updates) =>
    set((state) => ({
      quinielas: state.quinielas.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    })),
  removeQuiniela: (id) =>
    set((state) => ({
      quinielas: state.quinielas.filter((q) => q.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
}));
