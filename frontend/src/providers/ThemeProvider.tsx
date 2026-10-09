'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from localStorage, fall back to OS preference
    let savedTheme: Theme | null = null;
    try {
      savedTheme = localStorage.getItem('theme') as Theme | null;
    } catch {
      // localStorage unavailable
    }

    let initialTheme: Theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      initialTheme = savedTheme;
    } else {
      initialTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  function applyTheme(t: Theme) {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function toggleTheme() {
    setTheme(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try {
        localStorage.setItem('theme', next);
      } catch {
        // localStorage unavailable — apply for current session only
      }
      return next;
    });
  }

  // Always render the Provider so that children can call useTheme().
  // The initial theme state is 'light' on both server and client, so there
  // is no hydration mismatch.  The effect (above) then updates the theme to
  // match localStorage / OS preference once the component mounts.
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
