import React, { createContext, useContext, useEffect, useState } from "react";
import { palettes } from "./theme";

const STORAGE_KEY = "officium-theme-mode";
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // "system" | "light" | "dark". Starts on "system" so the app follows the
  // OS/browser preference until the person explicitly overrides it, at
  // which point that choice is remembered.
  const [mode, setMode] = useState(() => {
    if (typeof window === "undefined") return "system";
    return localStorage.getItem(STORAGE_KEY) || "system";
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return true;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setSystemPrefersDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (mode === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [mode]);

  const effectiveMode = mode === "system" ? (systemPrefersDark ? "dark" : "light") : mode;
  const theme = palettes[effectiveMode];

  // Keep the browser chrome (address bar color etc.) in sync too.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme.bg);
  }, [theme.bg]);

  function toggle() {
    setMode(effectiveMode === "dark" ? "light" : "dark");
  }

  function useSystem() {
    setMode("system");
  }

  return (
    <ThemeContext.Provider value={{ ...theme, mode, effectiveMode, toggle, useSystem, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
