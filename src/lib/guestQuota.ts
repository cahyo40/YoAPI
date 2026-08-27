const KEY = "yoapi_guest_reqs";
const DAY = 24 * 60 * 60 * 1000; // window reset harian
export const GUEST_LIMIT = 7; // request sukses per window sebelum login diminta (nudge, bukan pagar keras)

type Quota = { count: number; since: number };

/**
 * Kuota guest — counter di localStorage, reset otomatis tiap 24 jam.
 * Sengaja lunak: bisa di-reset user (clear storage / incognito). Tujuannya
 * mendorong login, bukan menegakkan batas keras (itu butuh server). Authed = tak terbatas.
 * ponytail: naikkan ke kuota per-IP server bila abuse jadi masalah nyata.
 */
function read(): Quota {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { count: 0, since: Date.now() };
    const q = JSON.parse(raw) as Quota;
    if (typeof q.count !== "number" || typeof q.since !== "number") throw 0;
    if (Date.now() - q.since >= DAY) return { count: 0, since: Date.now() }; // window lewat → reset
    return q;
  } catch {
    return { count: 0, since: Date.now() };
  }
}

function write(q: Quota): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
  } catch {
    // abaikan
  }
}

export function guestRemaining(): number {
  return Math.max(0, GUEST_LIMIT - read().count);
}

/** Naikkan counter; kembalikan sisa setelah dinaikkan. */
export function bumpGuest(): number {
  const q = read();
  const next: Quota = { count: q.count + 1, since: q.since };
  write(next);
  return Math.max(0, GUEST_LIMIT - next.count);
}
