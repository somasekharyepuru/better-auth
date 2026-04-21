import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import { settingsApi } from '../lib/daymark-api';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  isDark: boolean;
  colors: typeof Colors.light | typeof Colors.dark;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    // Force light scheme regardless of system preference or saved setting
    setColorScheme('light');
    setThemeState('light');
  }, [theme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setThemeState(savedTheme);
      }

      // Keep theme synced with backend settings when available.
      try {
        const remoteSettings = await settingsApi.get();
        const remoteTheme = remoteSettings?.theme;
        if (remoteTheme === 'light' || remoteTheme === 'dark' || remoteTheme === 'system') {
          setThemeState(remoteTheme);
          await AsyncStorage.setItem(THEME_STORAGE_KEY, remoteTheme);
        }
      } catch {
        // Ignore when unauthenticated or backend settings unavailable.
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);

      try {
        await settingsApi.update({ theme: newTheme });
      } catch {
        // Keep local theme even if backend sync fails.
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const isDark = false;
  const colors = Colors.light;

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, isDark, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
