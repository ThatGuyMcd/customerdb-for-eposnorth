import { useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { lightTheme, darkTheme, Theme } from '@/constants/colors';

const THEME_KEY = 'customerdb_theme';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light') {
        setIsDark(stored === 'dark');
      } else {
        setIsDark(systemScheme === 'dark');
      }
      setIsLoaded(true);
    });
  }, [systemScheme]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const newValue = !prev;
      AsyncStorage.setItem(THEME_KEY, newValue ? 'dark' : 'light');
      return newValue;
    });
  }, []);

  const theme: Theme = isDark ? darkTheme : lightTheme;

  return {
    isDark,
    theme,
    toggleTheme,
    isLoaded,
  };
});
