import { create } from 'zustand';
import type { ApiTestResult } from '../types';

interface AppStore {
  // Results tracking
  results: ApiTestResult[];
  addResult: (result: ApiTestResult) => void;
  clearResults: () => void;

  // UI state
  selectedProvider: string | null;
  setSelectedProvider: (provider: string | null) => void;
}

const initialResults: ApiTestResult[] =
  typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('testResults') || '[]')
    : [];

const persistResults = (results: ApiTestResult[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('testResults', JSON.stringify(results));
  }
};

export const useAppStore = create<AppStore>((set) => ({
  results: initialResults,
  addResult: (result) =>
    set((state) => {
      const updated = [result, ...state.results].slice(0, 100);
      persistResults(updated);
      return { results: updated };
    }),
  clearResults: () => {
    persistResults([]);
    return { results: [] };
  },

  selectedProvider: null,
  setSelectedProvider: (provider) => set({ selectedProvider: provider }),
}));
