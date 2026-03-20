import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { colors, type ColorScheme, type Colors } from './colors';

type ThemeContextType = {
  colorScheme: ColorScheme;
  c: Colors;
  toggleTheme: () => void;
  setTheme: (scheme: ColorScheme) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    systemScheme === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    if (systemScheme) {
      setColorScheme(systemScheme === 'dark' ? 'dark' : 'light');
    }
  }, [systemScheme]);

  const toggleTheme = () => {
    setColorScheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (scheme: ColorScheme) => setColorScheme(scheme);

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        c: colors[colorScheme],
        toggleTheme,
        setTheme,
        isDark: colorScheme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
