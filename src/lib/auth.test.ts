import test from "node:test";
import assert from "node:assert/strict";
import { authHeader, emptyAuth } from "./auth.ts";

test("bearer → Authorization Bearer", () => {
  const h = authHeader({ ...emptyAuth, type: "bearer", token: "tok" });
  assert.deepEqual(h, { key: "Authorization", value: "Bearer tok", enabled: true });
});

test("basic → Authorization Basic base64", () => {
  const h = authHeader({ ...emptyAuth, type: "basic", username: "u", password: "p" });
  assert.equal(h?.value, `Basic ${btoa("u:p")}`);
});

test("apikey → header custom; none/kosong → null", () => {
  const h = authHeader({ ...emptyAuth, type: "apikey", token: "k", apiKeyName: "X-Key" });
  assert.deepEqual(h, { key: "X-Key", value: "k", enabled: true });
  assert.equal(authHeader({ ...emptyAuth, type: "bearer", token: "" }), null);
  assert.equal(authHeader(emptyAuth), null);
});
