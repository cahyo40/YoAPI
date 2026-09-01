import test from "node:test";
import assert from "node:assert/strict";
import { parseCurl } from "./parseCurl.ts";

test("cURL sederhana GET", () => {
  const r = parseCurl("curl https://api.example.com/users");
  assert.equal(r.method, "GET");
  assert.equal(r.url, "https://api.example.com/users");
  assert.equal(r.headers.length, 0);
});

test("cURL POST -H -d multiline", () => {
  const r = parseCurl(`curl -X POST https://api.example.com/login \\
    -H 'Content-Type: application/json' \\
    -H "Authorization: Bearer tok123" \\
    -d '{"email":"a@b.com","pw":"x"}'`);
  assert.equal(r.method, "POST");
  assert.equal(r.url, "https://api.example.com/login");
  assert.equal(r.headers.length, 2);
  assert.deepEqual(r.headers[0], { key: "Content-Type", value: "application/json", enabled: true });
  assert.equal(r.headers[1].value, "Bearer tok123");
  assert.equal(r.body, '{"email":"a@b.com","pw":"x"}');
});

test("cURL -d tanpa -X → POST implisit; flag gabungan --data=", () => {
  const r = parseCurl("curl --url https://x.io --data=hello -s --compressed");
  assert.equal(r.method, "POST");
  assert.equal(r.url, "https://x.io");
  assert.equal(r.body, "hello");
});

test("cURL -u → Authorization Basic", () => {
  const r = parseCurl("curl -u user:pass https://x.io");
  assert.equal(r.headers[0].key, "Authorization");
  assert.equal(r.headers[0].value, `Basic ${btoa("user:pass")}`);
});

test("cURL -A → User-Agent header", () => {
  const r = parseCurl("curl -A 'CustomApp/1.0' https://x.io");
  assert.equal(r.headers.length, 1);
  assert.equal(r.headers[0].key, "User-Agent");
  assert.equal(r.headers[0].value, "CustomApp/1.0");
});
