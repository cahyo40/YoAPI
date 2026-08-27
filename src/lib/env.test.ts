import test from "node:test";
import assert from "node:assert/strict";
import { interpolate, applyEnv, envMap } from "./env.ts";

test("interpolate ganti var dikenal", () => {
  const r = interpolate("{{base}}/users/{{id}}", { base: "https://api.io", id: "7" });
  assert.equal(r.out, "https://api.io/users/7");
  assert.deepEqual(r.missing, []);
});

test("interpolate var hilang → biarkan mentah + catat", () => {
  const r = interpolate("{{base}}/x/{{gone}}", { base: "https://api.io" });
  assert.equal(r.out, "https://api.io/x/{{gone}}");
  assert.deepEqual(r.missing, ["gone"]);
});

test("applyEnv sub url+header+body, kumpul missing unik", () => {
  const env = envMap([{ key: "base", value: "https://api.io" }, { key: "tok", value: "abc" }]);
  const r = applyEnv(
    {
      url: "{{base}}/me",
      headers: [{ key: "Authorization", value: "Bearer {{tok}}", enabled: true }],
      params: [{ key: "q", value: "{{missing1}}", enabled: true }],
      body: "{{missing1}}{{missing2}}",
    },
    env
  );
  assert.equal(r.url, "https://api.io/me");
  assert.equal(r.headers[0].value, "Bearer abc");
  assert.deepEqual(r.missing.sort(), ["missing1", "missing2"]);
});
