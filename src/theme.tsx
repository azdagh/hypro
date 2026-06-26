import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** Telegram-style circle reveal animation for theme toggle */
  animatedSetTheme: (nextTheme: Theme, x: number, y: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Resolves the effective theme ('light' or 'dark') from the user preference.
 */
function resolveEffective(t: Theme): 'light' | 'dark' {
  if (t === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return t;
}

/**
 * Applies the resolved theme to the DOM <html> element.
 */
function applyThemeToDOM(effective: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(effective);
  root.style.colorScheme = effective;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('hypro_theme');
    // Default to 'dark' for new users (no saved preference)
    return (saved === 'light' || saved === 'dark' || saved === 'system') ? saved : 'dark';
  });

  const animatingRef = useRef(false);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('hypro_theme', newTheme);
  }, []);

  /**
   * Telegram-style animated theme switch using the View Transition API.
   * 
   * How it works (exactly like Telegram):
   * 1. We call document.startViewTransition() which captures a screenshot of the current state
   * 2. Inside the callback, we apply the new theme to the DOM
   * 3. The browser creates ::view-transition-old (screenshot of old theme) and ::view-transition-new (live new theme)
   * 4. Our CSS clip-path circle animation on ::view-transition-new reveals the new theme from the click point
   * 5. The old theme screenshot stays behind and is revealed through the growing/shrinking circle
   * 
   * This means the user sees the ACTUAL new theme appearing bit by bit through the circle — not a solid color overlay.
   * 
   * Fallback: If View Transition API is not supported, we just switch instantly.
   */
  const animatedSetTheme = useCallback((nextTheme: Theme, x: number, y: number) => {
    if (animatingRef.current) return;

    const effectiveNext = resolveEffective(nextTheme);
    const effectiveCurrent = resolveEffective(theme);
    
    // If the effective theme is the same, just save the preference
    if (effectiveNext === effectiveCurrent) {
      setTheme(nextTheme);
      return;
    }

    // Set CSS custom properties for the circle center
    document.documentElement.style.setProperty('--theme-transition-x', `${x}px`);
    document.documentElement.style.setProperty('--theme-transition-y', `${y}px`);

    // Calculate the maximum radius needed to cover the entire viewport
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    document.documentElement.style.setProperty('--theme-transition-radius', `${maxRadius}px`);

    // Check if View Transition API is supported
    if (!(document as any).startViewTransition) {
      // Fallback: instant switch
      setTheme(nextTheme);
      applyThemeToDOM(effectiveNext);
      return;
    }

    animatingRef.current = true;

    const transition = (document as any).startViewTransition(() => {
      // Apply the new theme inside the transition callback
      applyThemeToDOM(effectiveNext);
      setTheme(nextTheme);
    });

    transition.finished.then(() => {
      animatingRef.current = false;
    }).catch(() => {
      animatingRef.current = false;
    });
  }, [theme, setTheme]);

  // Apply theme to DOM on mount and when theme changes
  useEffect(() => {
    applyThemeToDOM(resolveEffective(theme));
  }, [theme]);

  // Sync with system theme changes if set to 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyThemeToDOM(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, animatedSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
