"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark";

function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return null;
}

let themeValue: Theme = "light";
let themeListeners: Array<() => void> = [];

function emitThemeChange() {
  for (const l of themeListeners) l();
}

function subscribeTheme(cb: () => void) {
  themeListeners = [...themeListeners, cb];
  return () => {
    themeListeners = themeListeners.filter((l) => l !== cb);
  };
}

function getThemeSnapshot(): Theme {
  return themeValue;
}

function getThemeServerSnapshot(): Theme {
  return "light";
}

function applyThemeToDOM(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function initializeTheme() {
  const stored = readStoredTheme();
  themeValue =
    stored ??
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  applyThemeToDOM(themeValue);
  localStorage.setItem("theme", themeValue);
}

if (typeof window !== "undefined") {
  initializeTheme();
}

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  mounted: boolean;
}>({ theme: "light", toggleTheme: () => {}, mounted: false });

export function useTheme() {
  return useContext(ThemeContext);
}

let mountListeners: Array<() => void> = [];
let isMounted = false;

function subscribeMount(cb: () => void) {
  mountListeners = [...mountListeners, cb];
  return () => {
    mountListeners = mountListeners.filter((l) => l !== cb);
  };
}

function getMountSnapshot(): boolean {
  return isMounted;
}

function getMountServerSnapshot(): boolean {
  return false;
}

if (typeof window !== "undefined" && !isMounted) {
  queueMicrotask(() => {
    isMounted = true;
    for (const l of mountListeners) l();
    mountListeners = [];
  });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  const mounted = useSyncExternalStore(
    subscribeMount,
    getMountSnapshot,
    getMountServerSnapshot
  );

  const toggleTheme = useCallback(() => {
    themeValue = themeValue === "dark" ? "light" : "dark";
    applyThemeToDOM(themeValue);
    localStorage.setItem("theme", themeValue);
    emitThemeChange();
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, mounted }),
    [theme, toggleTheme, mounted]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
