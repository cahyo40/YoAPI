import { test } from "node:test";
import assert from "node:assert/strict";

// Shim localStorage sebelum import modul.
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => void (store[k] = v),
  removeItem: (k: string) => void delete store[k],
};

const { guestRemaining, bumpGuest, GUEST_LIMIT } = await import("./guestQuota.ts");

test("sisa awal = limit", () => {
  assert.equal(guestRemaining(), GUEST_LIMIT);
});

test("bump menaikkan & mengembalikan sisa", () => {
  assert.equal(bumpGuest(), GUEST_LIMIT - 1);
  assert.equal(guestRemaining(), GUEST_LIMIT - 1);
});

test("sisa tak pernah negatif setelah lewat limit", () => {
  for (let i = 0; i < GUEST_LIMIT + 5; i++) bumpGuest();
  assert.equal(guestRemaining(), 0);
});

test("reset otomatis saat window 24 jam lewat", () => {
  // paksa timestamp lama → read() harus reset count ke 0
  store["yoapi_guest_reqs"] = JSON.stringify({ count: GUEST_LIMIT, since: Date.now() - 25 * 60 * 60 * 1000 });
  assert.equal(guestRemaining(), GUEST_LIMIT);
});
