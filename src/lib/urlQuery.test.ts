import { test } from "node:test";
import assert from "node:assert/strict";
import { splitUrlQuery, mergeParams } from "./urlQuery.ts";

test("splitUrlQuery: pisah query jadi pairs", () => {
  const r = splitUrlQuery("https://api.sansekai.my.id/api/komik/recommended?type=manga");
  assert.equal(r.base, "https://api.sansekai.my.id/api/komik/recommended");
  assert.deepEqual(r.pairs, [{ key: "type", value: "manga", enabled: true }]);
});

test("splitUrlQuery: multi param + decode + spasi", () => {
  const r = splitUrlQuery("https://x.com/s?q=hello+world&page=2");
  assert.equal(r.base, "https://x.com/s");
  assert.deepEqual(r.pairs, [
    { key: "q", value: "hello world", enabled: true },
    { key: "page", value: "2", enabled: true },
  ]);
});

test("splitUrlQuery: tanpa query → pairs kosong", () => {
  const r = splitUrlQuery("https://x.com/a");
  assert.equal(r.base, "https://x.com/a");
  assert.deepEqual(r.pairs, []);
});

test("splitUrlQuery: key tanpa value", () => {
  const r = splitUrlQuery("https://x.com/a?debug");
  assert.deepEqual(r.pairs, [{ key: "debug", value: "", enabled: true }]);
});

test("mergeParams: key baru ditambah, key sama di-update + diaktifkan", () => {
  const existing = [{ key: "type", value: "old", enabled: false }];
  const out = mergeParams(existing, [
    { key: "type", value: "manga", enabled: true },
    { key: "page", value: "1", enabled: true },
  ]);
  assert.deepEqual(out, [
    { key: "type", value: "manga", enabled: true },
    { key: "page", value: "1", enabled: true },
  ]);
});
