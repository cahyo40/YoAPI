import test from "node:test";
import assert from "node:assert/strict";
import { encodeShare, decodeShare } from "./share.ts";

const state = {
  method: "POST" as const,
  url: "https://api.example.com/löve/日本",
  headers: [{ key: "Authorization", value: "Bearer x", enabled: true }],
  params: [{ key: "q", value: "1", enabled: true }],
  body: '{"a":1}',
};

test("round-trip encode/decode (unicode aman)", () => {
  const t = encodeShare(state);
  assert.match(t, /^[A-Za-z0-9_-]+$/); // base64url, tanpa +/=
  assert.deepEqual(decodeShare(t), state);
});

test("token rusak → null, tak lempar", () => {
  assert.equal(decodeShare("!!!not-valid!!!"), null);
  assert.equal(decodeShare(encodeShare({ ...state, url: undefined as any })), null);
});
