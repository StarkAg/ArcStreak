// Theme storage utilities
// Stores and retrieves the theme preference from AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@arcstreak:theme';

export type ThemeMode = 'dark' | 'light' | 'auto';

// Get stored theme
export const getStoredTheme = async (): Promise<ThemeMode> => {
  try {
    const theme = await AsyncStorage.getItem(THEME_KEY);
    if (theme && (theme === 'dark' || theme === 'light' || theme === 'auto')) {
      return theme as ThemeMode;
    }
    return 'auto'; // Default to auto
  } catch (error) {
    console.error('Error getting theme:', error);
    return 'auto';
  }
};

// Save theme
export const saveTheme = async (theme: ThemeMode): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.error('Error saving theme:', error);
  }
};

