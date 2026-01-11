import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeMode, getStoredTheme, saveTheme } from '../utils/themeStorage';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  error: string;
  success: string;
};

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceSecondary: '#E5E5E5',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
  primary: '#FF6500',
  error: '#FF4444',
  success: '#FF6500',
};

const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#1A1A1A',
  surfaceSecondary: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#2A2A2A',
  primary: '#FF6500',
  error: '#FF6B6B',
  success: '#FF6500',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const systemColorScheme = useColorScheme();

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await getStoredTheme();
      setThemeModeState(storedTheme);
    };
    loadTheme();
  }, []);

  // Determine if dark mode should be used
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await saveTheme(mode);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, colors, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

