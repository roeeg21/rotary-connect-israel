import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Account = {
  firstName: string;
  lastName: string;
  email: string;
  club: string;
  photo?: string;
  onboarded: boolean;
};

type State = {
  account: Account | null;
  saved: string[];
  recentSearches: string[];
  recentlyViewed: string[];
  guestSearches: number;
};

const EMPTY: State = {
  account: null,
  saved: [],
  recentSearches: [],
  recentlyViewed: [],
  guestSearches: 0,
};

const KEY = "rc-state-v1";

type Ctx = State & {
  isGuest: boolean;
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  addRecentlyViewed: (id: string) => void;
  /** Returns false when a guest has used the single free search. */
  consumeGuestSearch: () => boolean;
  signIn: (account: Account) => void;
  signOut: () => void;
};

const AppStateContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setState({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const update = useCallback((fn: (s: State) => State) => {
    setState((prev) => {
      const next = fn(prev);
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      isGuest: !state.account,
      isSaved: (id) => state.saved.includes(id),
      toggleSaved: (id) =>
        update((s) => ({
          ...s,
          saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [id, ...s.saved],
        })),
      addRecentSearch: (q) =>
        update((s) => ({
          ...s,
          recentSearches: [q, ...s.recentSearches.filter((x) => x !== q)].slice(0, 6),
        })),
      clearRecentSearches: () => update((s) => ({ ...s, recentSearches: [] })),
      addRecentlyViewed: (id) =>
        update((s) => ({
          ...s,
          recentlyViewed: [id, ...s.recentlyViewed.filter((x) => x !== id)].slice(0, 8),
        })),
      consumeGuestSearch: () => {
        if (state.account) return true;
        if (state.guestSearches >= 1) return false;
        update((s) => ({ ...s, guestSearches: s.guestSearches + 1 }));
        return true;
      },
      signIn: (account) => update((s) => ({ ...s, account })),
      signOut: () => update((s) => ({ ...s, account: null })),
    }),
    [state, update],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
