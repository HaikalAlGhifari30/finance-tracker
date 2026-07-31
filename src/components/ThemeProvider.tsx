"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<string>('system');

  const updateMetaThemeColor = (isDark: boolean) => {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', isDark ? '#13111C' : '#F8F9FD');
    
    // Also update Apple status bar style dynamically if needed, though black-translucent is usually enough
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
      const isDark = t === 'dark' || (t === 'system' && mediaQuery.matches);
      d.classList.toggle('dark', isDark);
      updateMetaThemeColor(isDark);
    };

    const handleChange = () => {
      const current = localStorage.getItem('theme') as Theme || 'system';
      if (current === 'system') {
        applyTheme('system');
      }
    };

    applyTheme(savedTheme);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (t: Theme) => {
    const d = document.documentElement;
    const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    d.classList.toggle('dark', isDark);
    updateMetaThemeColor(isDark);
    localStorage.setItem('theme', t);
    // Set cookie for server-side theme detection
    document.cookie = `theme=${t}; path=/; max-age=31536000; SameSite=Lax`;
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return { theme: 'system', setTheme: () => {} };
  }
  return context;
};
