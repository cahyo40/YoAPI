import { useCallback, useEffect, useState } from "react";

const KEY = "yoapi_theme";

/**
 * Tema instrumen — dark-first (DESIGN.md "The Instrument Panel").
 * Root = dark; class `.light` mengaktifkan daylight bench. Default gelap
 * kecuali user menyimpan preferensi light.
 */
export function useTheme() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    let isDark: boolean;
    try {
      const saved = localStorage.getItem(KEY);
      // Dark-first: hanya light bila user memilihnya secara eksplisit.
      isDark = saved ? saved === "dark" : true;
    } catch {
      isDark = true;
    }
    setDark(isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("light", !next);
      try {
        localStorage.setItem(KEY, next ? "dark" : "light");
      } catch {
        // abaikan
      }
      return next;
    });
  }, []);

  return { dark, toggle };
}
