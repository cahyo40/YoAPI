import test from "node:test";
import assert from "node:assert/strict";
import { parsePostman } from "./parsePostman.ts";

const SAMPLE = JSON.stringify({
  info: { name: "Shinigami" },
  item: [
    {
      name: "List By Popularity",
      request: {
        method: "GET",
        header: [],
        url: {
          raw: "https://api.shngm.io/v1/manga/list?page=1&sort=popularity",
          query: [
            { key: "page", value: "1" },
            { key: "sort", value: "popularity" },
          ],
        },
      },
    },
    {
      name: "Folder",
      item: [
        {
          name: "Nested POST",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            url: "https://api.shngm.io/v1/login",
            body: { mode: "raw", raw: '{"a":1}' },
          },
        },
      ],
    },
  ],
});

test("parsePostman: nama koleksi + flatten folder", () => {
  const r = parsePostman(SAMPLE);
  assert.equal(r.name, "Shinigami");
  assert.equal(r.items.length, 2);
});

test("parsePostman: url objek → base bersih + params dari query", () => {
  const r = parsePostman(SAMPLE);
  const first = r.items[0];
  assert.equal(first.method, "GET");
  assert.equal(first.url, "https://api.shngm.io/v1/manga/list");
  assert.equal(first.params.length, 2);
  assert.deepEqual(first.params[0], { key: "page", value: "1", enabled: true });
});

test("parsePostman: request bersarang di folder + body raw + url string", () => {
  const r = parsePostman(SAMPLE);
  const nested = r.items[1];
  assert.equal(nested.name, "Nested POST");
  assert.equal(nested.method, "POST");
  assert.equal(nested.url, "https://api.shngm.io/v1/login");
  assert.equal(nested.headers[0].key, "Content-Type");
  assert.equal(nested.body, '{"a":1}');
});

test("parsePostman: JSON bukan koleksi → throw", () => {
  assert.throws(() => parsePostman('{"foo":1}'), /Postman Collection/);
});

test("parsePostman: query disabled → enabled false", () => {
  const raw = JSON.stringify({
    info: { name: "X" },
    item: [
      {
        name: "q",
        request: {
          method: "GET",
          url: { raw: "https://x.io?a=1", query: [{ key: "a", value: "1", disabled: true }] },
        },
      },
    ],
  });
  const r = parsePostman(raw);
  assert.equal(r.items[0].params[0].enabled, false);
});
