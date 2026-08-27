import test from "node:test";
import assert from "node:assert/strict";
import { isSensitive, hasSensitive, maskSensitive } from "./sensitiveHeaders.ts";

const on = (key: string, value: string) => ({ key, value, enabled: true });

test("deteksi header sensitif via nama", () => {
  assert.ok(isSensitive(on("Authorization", "abc")));
  assert.ok(isSensitive(on("x-api-key", "k")));
  assert.ok(isSensitive(on("Cookie", "s=1")));
});

test("deteksi Bearer via nilai", () => {
  assert.ok(isSensitive(on("X-Custom", "Bearer tok123")));
});

test("header biasa tidak sensitif", () => {
  assert.ok(!isSensitive(on("Content-Type", "application/json")));
  assert.ok(!hasSensitive([on("Accept", "*/*")]));
});

test("masking hanya nilai sensitif", () => {
  const masked = maskSensitive([on("Authorization", "Bearer x"), on("Accept", "json")]);
  assert.equal(masked[0].value, "••••••");
  assert.equal(masked[1].value, "json");
});
