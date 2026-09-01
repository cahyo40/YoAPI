import { test } from "node:test";
import assert from "node:assert/strict";
import handler from "./proxy.ts";

function createMockRes() {
  let statusCode = 200;
  let jsonBody: any = null;
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      jsonBody = data;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get jsonBody() {
      return jsonBody;
    },
  };
}

test("proxy handler: rejects private IPv4 loopback with 403", async () => {
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
    body: { url: "http://127.0.0.1:8000/test", method: "GET" },
  };
  const res = createMockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 403);
  assert.match(res.jsonBody?.error, /blocked \(private\) address/);
});

test("proxy handler: rejects private IPv6 loopback with 403", async () => {
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
    body: { url: "http://[::1]:8000/test", method: "GET" },
  };
  const res = createMockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 403);
  assert.match(res.jsonBody?.error, /blocked \(private\) address/);
});

test("proxy handler: allows valid public URLs and resolves properly", async () => {
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
    body: { url: "https://jsonplaceholder.typicode.com/todos/1", method: "GET" },
  };
  const res = createMockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.jsonBody?.status, 200);
  assert.ok(res.jsonBody?.body);
});
