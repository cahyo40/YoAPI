import { test } from "node:test";
import assert from "node:assert/strict";
import { generateCurl } from "./curlGenerator.ts";
import { parseCurl } from "./parseCurl.ts";

test("generateCurl: simple GET", () => {
  const curl = generateCurl({
    method: "GET",
    url: "https://api.example.com/users",
    headers: [],
    params: [],
    body: "",
  });
  assert.equal(curl, "curl \\\n  'https://api.example.com/users'");
});

test("generateCurl: GET dengan query params", () => {
  const curl = generateCurl({
    method: "GET",
    url: "https://api.example.com/users",
    headers: [],
    params: [
      { key: "page", value: "2", enabled: true },
      { key: "limit", value: "10", enabled: true },
      { key: "unused", value: "x", enabled: false },
    ],
    body: "",
  });
  assert.equal(curl, "curl \\\n  'https://api.example.com/users?page=2&limit=10'");
});

test("generateCurl: POST dengan Headers dan JSON Body", () => {
  const curl = generateCurl({
    method: "POST",
    url: "https://api.example.com/login",
    headers: [
      { key: "Authorization", value: "Bearer secret-tok", enabled: true },
      { key: "Content-Type", value: "application/json", enabled: true },
    ],
    params: [],
    body: '{"email":"test@yoapi.id","name":"YoApi"}',
  });
  assert.ok(curl.includes("-X POST"));
  assert.ok(curl.includes("'https://api.example.com/login'"));
  assert.ok(curl.includes("-H 'Authorization: Bearer secret-tok'"));
  assert.ok(curl.includes("-H 'Content-Type: application/json'"));
  assert.ok(curl.includes(`-d '{"email":"test@yoapi.id","name":"YoApi"}'`));

  // Verifikasi round-trip ke parseCurl
  const parsed = parseCurl(curl);
  assert.equal(parsed.method, "POST");
  assert.equal(parsed.url, "https://api.example.com/login");
  assert.equal(parsed.body, '{"email":"test@yoapi.id","name":"YoApi"}');
  assert.equal(parsed.headers.length, 2);
});

test("generateCurl: escape single quote", () => {
  const curl = generateCurl({
    method: "POST",
    url: "https://api.example.com/item",
    headers: [],
    params: [],
    body: "it's working",
  });
  assert.match(curl, /it'\\''s working/);
});
