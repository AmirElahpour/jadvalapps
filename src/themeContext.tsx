/**
 * Theme context — resolves palette by mode + design tokens.
 */
import React, { useMemo, createContext, useContext } from 'react';
import { useStore } from './store';
import { palette, font, spacing, radius, shadow, Palette, ThemeMode } from './theme';

export interface ThemeCtx {
  mode: ThemeMode;
  p: Palette;
  font: typeof font;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: ReturnType<typeof shadow>;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useStore();
  const mode: ThemeMode = theme;

  const value = useMemo<ThemeCtx>(() => {
    return {
      mode,
      p: palette[mode],
      font,
      spacing,
      radius,
      shadow: shadow(mode),
      toggle: () => toggleTheme(),
      setMode: (m) => {
        if (m !== mode) toggleTheme();
      },
    } as ThemeCtx;
  }, [mode, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
