import test from "node:test";
import assert from "node:assert/strict";
import { improveNames } from "./improveNames.ts";

test("nama tunggal berawalan adjektiva → nama key induk", () => {
  const src = `class PurpleY { }\nclass Other { PurpleY y; }`;
  const out = improveNames(src);
  assert.ok(out.includes("class Y {"));
  assert.ok(out.includes("Y y;"));
  assert.ok(!out.includes("Purple"));
});

test("dua shape berbagi key → base + base2", () => {
  const src = `class PurpleM { }\nclass FluffyM { }`;
  const out = improveNames(src);
  assert.ok(out.includes("class M {"));
  assert.ok(out.includes("class M2 {"));
});

test("kode tanpa nama adjektiva tak berubah", () => {
  const src = `class User {\n  int id;\n}`;
  assert.equal(improveNames(src), src);
});

test("tak tabrakan dengan class yang sudah ada bernama base", () => {
  const src = `class Y { }\nclass PurpleY { }`;
  const out = improveNames(src);
  // PurpleY tak boleh jadi "Y" (sudah ada) → dapat suffix
  assert.ok(out.includes("class Y {"));
  assert.ok(/class Y_+ \{|class Y2 \{/.test(out) || out.match(/class Y\b/g)!.length === 1);
});
