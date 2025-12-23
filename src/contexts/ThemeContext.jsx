'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Initialize as false to ensure server/client match during hydration
  const [isHighContrast, setIsHighContrast] = useState(false);
  // Track if component has mounted to safely access window/localStorage
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Recover state from localStorage on mount
    const saved = localStorage.getItem('highContrast') === 'true';
    if (saved) {
      setIsHighContrast(true);
    }
  }, []);

  useEffect(() => {
    // Only apply side effects after mount to avoid hydration mismatch
    if (!mounted) return;

    // Apply high contrast class to root element
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    // Save preference to localStorage
    localStorage.setItem('highContrast', isHighContrast);
  }, [isHighContrast, mounted]);

  const toggleHighContrast = () => {
    setIsHighContrast(!isHighContrast);
  };

  return (
    <ThemeContext.Provider value={{ isHighContrast, toggleHighContrast }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
