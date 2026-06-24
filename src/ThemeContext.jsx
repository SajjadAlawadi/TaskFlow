import { createContext, useContext, useState } from 'react';

export const THEMES = {
  dark: {
    BG:        '#0D1117',
    SURFACE:   '#161B22',
    BORDER:    '#21262D',
    MUTED:     '#8B949E',
    TEXT:      '#E6EDF3',
    AMBER:     '#F0A500',
    HOVER:     '#1c2128',
    SCROLLBAR: '#30363D',
    INPUT_BG:  '#0D1117',
    AMBER_GLOW:'rgba(240,165,0,.45)',
    AMBER_BG:  'rgba(240,165,0,.12)',
    AMBER_RING:'rgba(240,165,0,.28)',
    AMBER_FOCUS:'rgba(240,165,0,.5)',
  },
  light: {
    BG:        '#FFFFFF',
    SURFACE:   '#F6F8FA',
    BORDER:    '#D0D7DE',
    MUTED:     '#656D76',
    TEXT:      '#1F2328',
    AMBER:     '#BF8700',
    HOVER:     '#EAF0F7',
    SCROLLBAR: '#C8D0D8',
    INPUT_BG:  '#FFFFFF',
    AMBER_GLOW:'rgba(191,135,0,.35)',
    AMBER_BG:  'rgba(191,135,0,.08)',
    AMBER_RING:'rgba(191,135,0,.30)',
    AMBER_FOCUS:'rgba(191,135,0,.4)',
  },
};

const ThemeContext = createContext({ theme: THEMES.dark, mode: 'dark', toggle: () => {} });

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('tf_theme') || 'dark') : 'dark'
  );

  const toggle = () => setMode(m => {
    const next = m === 'dark' ? 'light' : 'dark';
    localStorage.setItem('tf_theme', next);
    return next;
  });

  return (
    <ThemeContext.Provider value={{ theme: THEMES[mode], mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
