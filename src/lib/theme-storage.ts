export type ThemeMode = "light" | "dark";

const THEME_KEY = "gymflow_theme";
const THEME_STORAGE_EVENT = "gymflow_theme_changed";

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark";
}

function notifyThemeChanged() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(THEME_STORAGE_EVENT));
}

export const themeStorage = {
  subscribe(callback: () => void) {
    if (typeof window === "undefined") {
      return () => {};
    }

    window.addEventListener(THEME_STORAGE_EVENT, callback);
    window.addEventListener("storage", callback);

    return () => {
      window.removeEventListener(THEME_STORAGE_EVENT, callback);
      window.removeEventListener("storage", callback);
    };
  },

  getTheme(): ThemeMode {
    if (typeof window === "undefined") return "light";

    const storedTheme = window.localStorage.getItem(THEME_KEY);

    if (isThemeMode(storedTheme)) {
      return storedTheme;
    }

    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    ).matches;

    return prefersDark ? "dark" : "light";
  },

  setTheme(theme: ThemeMode) {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(THEME_KEY, theme);
    notifyThemeChanged();
  },
};
