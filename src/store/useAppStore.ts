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

const STORAGE_KEY = 'testResults';
const MAX_RESULTS = 100;

// Full keys stay in memory for the session only; JSON.stringify drops undefined.
const withoutFullKey = (result: ApiTestResult): ApiTestResult => ({ ...result, fullKey: undefined });

const loadResults = (): ApiTestResult[] => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? (parsed as ApiTestResult[]).map(withoutFullKey) : [];
  } catch {
    return [];
  }
};

const persistResults = (results: ApiTestResult[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results.map(withoutFullKey)));
  } catch {
    // Storage full or blocked (private mode) — history just won't persist.
  }
};

const initialResults = loadResults();
// Rewrite storage once so keys saved by older versions are scrubbed.
persistResults(initialResults);

export const useAppStore = create<AppStore>((set) => ({
  results: initialResults,
  addResult: (result) =>
    set((state) => {
      const updated = [result, ...state.results].slice(0, MAX_RESULTS);
      persistResults(updated);
      return { results: updated };
    }),
  clearResults: () => {
    persistResults([]);
    set({ results: [] });
  },

  selectedProvider: null,
  setSelectedProvider: (provider) => set({ selectedProvider: provider }),
}));
