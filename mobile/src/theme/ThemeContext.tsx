import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { BRAND } from '../config/brand';
import { useApp } from '../context/AppContext';

export interface AppColors {
  primary: string;
  primaryDark: string;
  accent: string;
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  water: string;
  protein: string;
  carbs: string;
  fat: string;
  isDark: boolean;
}

const LIGHT_COLORS: AppColors = {
  primary: BRAND.primaryColor,
  primaryDark: BRAND.primaryDarkColor,
  accent: BRAND.accentColor,
  background: '#F5F7F5',
  card: '#FFFFFF',
  text: '#1A241B',
  textMuted: '#5C6B5E',
  border: '#E1EAE2',
  success: '#2E7D32',
  warning: '#E68A00',
  danger: '#C62828',
  water: '#0288D1',
  protein: '#7B1FA2',
  carbs: '#EF6C00',
  fat: '#00897B',
  isDark: false,
};

const DARK_COLORS: AppColors = {
  primary: '#4CAF50',
  primaryDark: BRAND.primaryColor,
  accent: '#1E3A22',
  background: '#101511',
  card: '#1A221B',
  text: '#EEF5EF',
  textMuted: '#9FB0A1',
  border: '#2A362C',
  success: '#66BB6A',
  warning: '#FFB74D',
  danger: '#EF5350',
  water: '#29B6F6',
  protein: '#BA68C8',
  carbs: '#FFA726',
  fat: '#4DB6AC',
  isDark: true,
};

const ThemeContext = createContext<AppColors>(LIGHT_COLORS);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const { settings } = useApp();
  const useDark =
    settings.theme === 'dark' || (settings.theme === 'system' && systemScheme === 'dark');
  return (
    <ThemeContext.Provider value={useDark ? DARK_COLORS : LIGHT_COLORS}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
