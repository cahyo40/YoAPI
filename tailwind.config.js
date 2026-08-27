/** @type {import('tailwindcss').Config} */
export default {
  // Dark-first: dark is the root instrument, `.light` is the daylight override.
  darkMode: ["selector", ".light"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // token warna dari DESIGN.md ("The Instrument Panel") — CSS vars di src/index.css
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        elevated: "var(--elevated)",
        text: "var(--text)",
        "text-dim": "var(--text-dim)",
        "text-faint": "var(--text-faint)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        signal: "var(--signal)",
        "signal-dim": "var(--signal-dim)",
        ok: "var(--ok)",
        info: "var(--info)",
        warn: "var(--warn)",
        err: "var(--err)",
        // teks di atas tombol berisi (kontras AA per-mode)
        "on-signal": "var(--on-signal)",
        "on-err": "var(--on-err)",
        // legacy aliases
        primary: "var(--primary)",
        success: "var(--success)",
        error: "var(--error)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        glow: "var(--glow)",
      },
      borderRadius: {
        panel: "14px",
      },
    },
  },
  plugins: [],
};
