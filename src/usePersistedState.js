import { useState, useEffect } from "react";

// Same shape as useState, but reads its initial value from localStorage and
// writes back on every change. Used for anything that should survive a
// reload — tradition, calendar, and (separately) theme mode.
export function usePersistedState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage can be unavailable (private browsing, quota exceeded,
      // disabled entirely) — fail silently rather than break the app.
    }
  }, [key, value]);

  return [value, setValue];
}
