"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { themeStorage, type ThemeMode } from "@/lib/theme-storage";

type ThemeContextValue = {
  theme: ThemeMode;
  isDarkMode: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getServerSnapshot(): ThemeMode {
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    themeStorage.subscribe,
    themeStorage.getTheme,
    getServerSnapshot,
  );

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    themeStorage.setTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    themeStorage.setTheme(theme === "dark" ? "light" : "dark");
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", theme === "dark");
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeMode must be used inside ThemeProvider.");
  }

  return context;
}
