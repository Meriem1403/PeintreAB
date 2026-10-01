import { createContext, useContext, useEffect, useState } from 'react';
import { siteSettingsAPI } from '../utils/apiService';

const DEFAULT_THEME = {
  primary_color: '#C6AC8F',
  accent_color: '#B89A7A',
  navbar_color: '#C6AC8F',
};

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  loading: true,
  refreshTheme: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

const applyThemeToDocument = (theme) => {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary_color);
  root.style.setProperty('--color-accent', theme.accent_color);
  root.style.setProperty('--color-navbar', theme.navbar_color);
  root.style.setProperty('--color-primary-rgb', hexToRgb(theme.primary_color));
};

const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `${r}, ${g}, ${b}`;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);

  const refreshTheme = async () => {
    try {
      const settings = await siteSettingsAPI.get();
      const nextTheme = {
        primary_color: settings.primary_color || DEFAULT_THEME.primary_color,
        accent_color: settings.accent_color || DEFAULT_THEME.accent_color,
        navbar_color: settings.navbar_color || DEFAULT_THEME.navbar_color,
      };
      setTheme(nextTheme);
      applyThemeToDocument(nextTheme);
    } catch (error) {
      console.error('Erreur chargement thème:', error);
      applyThemeToDocument(DEFAULT_THEME);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyThemeToDocument(DEFAULT_THEME);
    refreshTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, loading, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
