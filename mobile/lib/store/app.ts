import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Account, Language, AppState } from "../types";

// Max items to keep in history
const MAX_RECENT_SEARCHES = 5;
const MAX_RECENTLY_VIEWED = 3;
const MAX_GUEST_SEARCHES = 1;

interface AppStore extends AppState {
  // Actions
  setAccount: (account: Account | null) => void;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;

  // Saved contacts
  saveContact: (memberId: string) => void;
  unsaveContact: (memberId: string) => void;
  isContactSaved: (memberId: string) => boolean;

  // Search history
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Recently viewed
  addRecentlyViewed: (memberId: string) => void;

  // Guest tracking
  incrementGuestSearches: () => void;
  canGuestSearch: () => boolean;

  // Auth
  signIn: (account: Account) => void;
  signOut: () => void;
  isSignedIn: () => boolean;

  // Reset
  reset: () => void;
}

const initialState: AppState = {
  account: null,
  language: "he",
  saved: [],
  recentSearches: [],
  recentlyViewed: [],
  guestSearches: 0,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Account
      setAccount: (account) => set({ account }),

      // Language
      setLanguage: (language) => set({ language }),
      toggleLanguage: () => set((state) => ({
        language: state.language === "he" ? "en" : "he"
      })),

      // Saved contacts
      saveContact: (memberId) =>
        set((state) => ({
          saved: state.saved.includes(memberId)
            ? state.saved
            : [...state.saved, memberId],
        })),

      unsaveContact: (memberId) =>
        set((state) => ({
          saved: state.saved.filter((id) => id !== memberId),
        })),

      isContactSaved: (memberId) => get().saved.includes(memberId),

      // Recent searches
      addRecentSearch: (query) =>
        set((state) => {
          const filtered = state.recentSearches.filter((q) => q !== query);
          return {
            recentSearches: [query, ...filtered].slice(0, MAX_RECENT_SEARCHES),
          };
        }),

      clearRecentSearches: () => set({ recentSearches: [] }),

      // Recently viewed
      addRecentlyViewed: (memberId) =>
        set((state) => {
          const filtered = state.recentlyViewed.filter((id) => id !== memberId);
          return {
            recentlyViewed: [memberId, ...filtered].slice(0, MAX_RECENTLY_VIEWED),
          };
        }),

      // Guest searches
      incrementGuestSearches: () =>
        set((state) => ({ guestSearches: state.guestSearches + 1 })),

      canGuestSearch: () => {
        const { account, guestSearches } = get();
        return account !== null || guestSearches < MAX_GUEST_SEARCHES;
      },

      // Auth
      signIn: (account) => set({ account, guestSearches: 0 }),
      signOut: () => set({ account: null }),
      isSignedIn: () => get().account !== null,

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: "rotary-connect-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        account: state.account,
        language: state.language,
        saved: state.saved,
        recentSearches: state.recentSearches,
        recentlyViewed: state.recentlyViewed,
        guestSearches: state.guestSearches,
      }),
    }
  )
);

// Selectors for performance
export const useAccount = () => useAppStore((state) => state.account);
export const useLanguage = () => useAppStore((state) => state.language);
export const useSavedContacts = () => useAppStore((state) => state.saved);
export const useRecentSearches = () => useAppStore((state) => state.recentSearches);
export const useRecentlyViewed = () => useAppStore((state) => state.recentlyViewed);
