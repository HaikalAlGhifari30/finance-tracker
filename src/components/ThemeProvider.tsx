"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: string;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<string>('system');
  const [isDark, setIsDark] = useState<boolean>(true);

  const updateMetaThemeColor = (dark: boolean) => {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', dark ? '#13111C' : '#F8F9FD');
    
    let metaAppleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!metaAppleStatus) {
      metaAppleStatus = document.createElement('meta');
      metaAppleStatus.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(metaAppleStatus);
    }
    metaAppleStatus.setAttribute('content', 'black-translucent');
    
    let metaAppleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!metaAppleCapable) {
      metaAppleCapable = document.createElement('meta');
      metaAppleCapable.setAttribute('name', 'apple-mobile-web-app-capable');
      document.head.appendChild(metaAppleCapable);
    }
    metaAppleCapable.setAttribute('content', 'yes');
  };

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'system';
    setThemeState(savedTheme);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = (t: Theme) => {
      const d = document.documentElement;
      const activeDark = t === 'dark' || (t === 'system' && mediaQuery.matches);
      d.classList.toggle('dark', activeDark);
      setIsDark(activeDark);
      updateMetaThemeColor(activeDark);
    };

    const handleChange = () => {
      const current = (localStorage.getItem('theme') as Theme) || 'system';
      applyTheme(current);
    };

    applyTheme(savedTheme);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (t: Theme) => {
    const d = document.documentElement;
    const activeDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    d.classList.toggle('dark', activeDark);
    setIsDark(activeDark);
    updateMetaThemeColor(activeDark);
    localStorage.setItem('theme', t);
    document.cookie = `theme=${t}; path=/; max-age=31536000; SameSite=Lax`;
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return { theme: 'system', isDark: true, setTheme: () => {} };
  }
  return context;
};
