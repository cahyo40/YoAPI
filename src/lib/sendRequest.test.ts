import { test } from "node:test";
import assert from "node:assert/strict";
import { isLocalTarget } from "./sendRequest.ts";

test("isLocalTarget", () => {
  assert.equal(isLocalTarget("http://localhost:3000/api"), true);
  assert.equal(isLocalTarget("http://127.0.0.1/x"), true);
  assert.equal(isLocalTarget("http://192.168.1.5/x"), true);
  assert.equal(isLocalTarget("http://10.0.0.1/x"), true);
  assert.equal(isLocalTarget("http://172.16.0.1/x"), true);
  assert.equal(isLocalTarget("https://api.example.com/users"), false);
  assert.equal(isLocalTarget("https://jsonplaceholder.typicode.com/users/1"), false);
});
