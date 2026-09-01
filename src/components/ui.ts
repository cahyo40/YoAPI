/**
 * Shared control classes for the instrument panel. One vocabulary, reused
 * everywhere (craft floor: same button shape, same field). Compose with
 * template strings, e.g. `className={btnGhost}`.
 */

// Primary illuminated key — the one signal-colored action per surface.
export const btnSignal =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-signal px-3 py-1.5 " +
  "font-mono text-[12px] font-semibold uppercase tracking-[0.06em] text-on-signal " +
  "shadow-glow transition hover:brightness-110 active:brightness-95 " +
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";

// Danger key — abort / destructive confirm.
export const btnDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-err px-3 py-1.5 " +
  "font-mono text-[12px] font-semibold uppercase tracking-[0.06em] text-on-err " +
  "transition hover:brightness-110 active:brightness-95 disabled:opacity-40";

// Outline key — secondary.
export const btnOutline =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-border-strong " +
  "bg-surface-2 px-2.5 py-1.5 text-[12px] font-medium text-text-dim transition " +
  "hover:border-signal-dim hover:text-text active:brightness-95 disabled:opacity-40";

// Quiet key — text-only toolbar action.
export const btnQuiet =
  "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium " +
  "text-text-dim transition hover:bg-surface-2 hover:text-signal disabled:opacity-40";

// Field input — mono value entry.
export const field =
  "w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-[12px] text-text " +
  "placeholder:text-text-faint transition focus:border-signal-dim focus:outline-none " +
  "focus:ring-1 focus:ring-signal-dim";

export const fieldMono = field + " font-mono tnum";

// Panel label — the small mono caps that title each console region.
export const panelLabel =
  "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-text-faint";
