import { test } from "node:test";
import assert from "node:assert/strict";
import { isBlockedIp } from "./ssrf.ts";

test("isBlockedIp — private & metadata blocked", () => {
  assert.equal(isBlockedIp("169.254.169.254"), true); // cloud metadata
  assert.equal(isBlockedIp("127.0.0.1"), true);
  assert.equal(isBlockedIp("10.0.0.5"), true);
  assert.equal(isBlockedIp("172.16.0.1"), true);
  assert.equal(isBlockedIp("192.168.1.1"), true);
  assert.equal(isBlockedIp("::1"), true);
  assert.equal(isBlockedIp("[::1]"), true); // bracketed IPv6
  assert.equal(isBlockedIp("fd00::1"), true);
  assert.equal(isBlockedIp("[fd00::1]"), true);
  assert.equal(isBlockedIp("::ffff:10.0.0.1"), true); // IPv4-mapped private
  assert.equal(isBlockedIp("not-an-ip"), true);
});

test("isBlockedIp — public allowed", () => {
  assert.equal(isBlockedIp("8.8.8.8"), false);
  assert.equal(isBlockedIp("1.1.1.1"), false);
  assert.equal(isBlockedIp("172.15.0.1"), false); // tepat di luar 172.16/12
  assert.equal(isBlockedIp("2606:4700:4700::1111"), false); // cloudflare v6
  assert.equal(isBlockedIp("[2606:4700:4700::1111]"), false); // bracketed public v6
});
