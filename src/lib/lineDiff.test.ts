import { test } from "node:test";
import assert from "node:assert/strict";
import { lineDiff } from "./lineDiff.ts";

test("lineDiff: identik → semua same", () => {
  const d = lineDiff("a\nb\nc", "a\nb\nc");
  assert.equal(d.length, 3);
  assert.ok(d.every((l) => l.kind === "same"));
});

test("lineDiff: baris berubah → del + add", () => {
  const d = lineDiff("a\nb\nc", "a\nX\nc");
  assert.deepEqual(
    d.map((l) => `${l.kind}:${l.text}`),
    ["same:a", "del:b", "add:X", "same:c"],
  );
});

test("lineDiff: penambahan di akhir", () => {
  const d = lineDiff("a", "a\nb");
  assert.deepEqual(d.map((l) => `${l.kind}:${l.text}`), ["same:a", "add:b"]);
});

test("lineDiff: penghapusan di awal", () => {
  const d = lineDiff("x\na\nb", "a\nb");
  assert.equal(d[0].kind, "del");
  assert.equal(d[0].text, "x");
});
