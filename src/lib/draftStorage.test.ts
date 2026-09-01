import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { saveDraft, loadDraft, clearDraft } from "./draftStorage.ts";

// Mock localStorage jika dijalankan di environment Node.js
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    length: 0,
  };
}

beforeEach(() => {
  localStorage.clear();
});

test("draftStorage: simpan dan muat draf", () => {
  assert.equal(loadDraft(), null);

  saveDraft({
    method: "POST",
    url: "https://api.example.com/items",
    headers: [{ key: "X-Test", value: "1", enabled: true }],
    params: [{ key: "q", value: "search", enabled: true }],
    body: '{"foo":"bar"}',
    auth: { type: "bearer", token: "tok123" },
  });

  const loaded = loadDraft();
  assert.notEqual(loaded, null);
  assert.equal(loaded?.method, "POST");
  assert.equal(loaded?.url, "https://api.example.com/items");
  assert.equal(loaded?.headers.length, 1);
  assert.equal(loaded?.params.length, 1);
  assert.equal(loaded?.body, '{"foo":"bar"}');
  assert.equal(loaded?.auth.type, "bearer");
  assert.equal(loaded?.auth.token, "tok123");
});

test("draftStorage: JSON rusak mengembalikan null tanpa error", () => {
  localStorage.setItem("yoapi_workbench_draft", "{ broken json");
  assert.equal(loadDraft(), null);
});

test("draftStorage: clearDraft menghapus data", () => {
  saveDraft({
    method: "GET",
    url: "https://api.example.com",
    headers: [],
    params: [],
    body: "",
    auth: { type: "none" },
  });
  assert.notEqual(loadDraft(), null);
  clearDraft();
  assert.equal(loadDraft(), null);
});
