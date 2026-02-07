import { create } from 'zustand';
import type { ApiTestResult, BookmarkedKey } from '../types';

interface AppStore {
  // Results tracking
  results: ApiTestResult[];
  addResult: (result: ApiTestResult) => void;
  clearResults: () => void;
  
  // Bookmarks
  bookmarks: BookmarkedKey[];
  addBookmark: (bookmark: BookmarkedKey) => void;
  removeBookmark: (id: string) => void;
  
  // UI state
  selectedProvider: string | null;
  setSelectedProvider: (provider: string | null) => void;
}

const initialBookmarks =
  typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('bookmarks') || '[]')
    : [];

export const useAppStore = create<AppStore>((set) => ({
  results: [],
  addResult: (result) =>
    set((state) => ({
      results: [result, ...state.results].slice(0, 100), // Keep last 100
    })),
  clearResults: () => set({ results: [] }),

  bookmarks: initialBookmarks,
  addBookmark: (bookmark) =>
    set((state) => {
      const updated = [...state.bookmarks, bookmark];
      if (typeof window !== 'undefined') {
        localStorage.setItem('bookmarks', JSON.stringify(updated));
      }
      return { bookmarks: updated };
    }),
  removeBookmark: (id) =>
    set((state) => {
      const updated = state.bookmarks.filter((b) => b.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('bookmarks', JSON.stringify(updated));
      }
      return { bookmarks: updated };
    }),

  selectedProvider: null,
  setSelectedProvider: (provider) => set({ selectedProvider: provider }),
}));
