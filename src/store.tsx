/**
 * Global state + AsyncStorage persistence for JadvalApps.
 */
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Course, INITIAL_STATE } from './logic';

const STORAGE_KEY = 'jadvalapps.state.v1';

interface Store extends AppState {
  hydrated: boolean;
  addCourse: (c: Course) => void;
  updateCourse: (c: Course) => void;
  deleteCourse: (id: number) => void;
  setSelectedCourseId: (id: number | null) => void;
  toggleTheme: () => void;
  setTheme: (t: 'dark' | 'light') => void;
  setWelcomeSeen: (v: boolean) => void;
  setUnitsCap: (n: number) => void;
  replaceCourses: (courses: Course[]) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  // Load persisted state once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        // System preference applies only on very first launch (no saved state at all).
        const systemTheme =
          typeof window !== 'undefined' &&
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: light)').matches
            ? 'light'
            : 'dark';
        if (raw) {
          const parsed = JSON.parse(raw);
          setState((prev) => ({
            ...prev,
            courses: Array.isArray(parsed?.courses) ? parsed.courses : [],
            theme: parsed?.theme === 'light' || parsed?.theme === 'dark' ? parsed.theme : systemTheme,
            welcomeSeen: !!parsed?.welcomeSeen,
            unitsCap: typeof parsed?.unitsCap === 'number' ? parsed.unitsCap : prev.unitsCap,
          }));
        } else {
          // First launch ever: follow the OS color scheme.
          setState((prev) => ({ ...prev, theme: systemTheme }));
        }
      } catch (e) {
        // corrupted state: keep defaults
      } finally {
        hydratedRef.current = true;
        setHydrated(true);
      }
    })();
  }, []);

  // Persist on change (after hydration)
  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const store = useMemo<Store>(
    () => ({
      ...state,
      hydrated,
      addCourse: (c) => setState((s) => ({ ...s, courses: [...s.courses, c] })),
      updateCourse: (c) =>
        setState((s) => ({
          ...s,
          courses: s.courses.map((x) => (x.id === c.id ? c : x)),
        })),
      deleteCourse: (id) =>
        setState((s) => ({
          ...s,
          courses: s.courses.filter((x) => x.id !== id),
          selectedCourseId: s.selectedCourseId === id ? null : s.selectedCourseId,
        })),
      setSelectedCourseId: (id) => setState((s) => ({ ...s, selectedCourseId: id })),
      toggleTheme: () => setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (t) => setState((s) => ({ ...s, theme: t })),
      setWelcomeSeen: (v) => setState((s) => ({ ...s, welcomeSeen: v })),
      setUnitsCap: (n) => setState((s) => ({ ...s, unitsCap: n })),
      replaceCourses: (courses) => setState((s) => ({ ...s, courses, selectedCourseId: null })),
    }),
    [state, hydrated]
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
