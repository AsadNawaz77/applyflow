import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors, DARK_COLORS, LIGHT_COLORS } from '../utils/constants';

type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
  mode: ThemeMode;
  colors: AppColors;
  toggleTheme: () => Promise<void>;
};

const STORAGE_KEY = '@applyflow_theme_mode';
const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        setMode(stored);
      }
    };
    load();
  }, []);

  const toggleTheme = async () => {
    const next: ThemeMode = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo<ThemeContextType>(
    () => ({
      mode,
      colors: mode === 'dark' ? DARK_COLORS : LIGHT_COLORS,
      toggleTheme,
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within ThemeProvider');
  return context;
}
