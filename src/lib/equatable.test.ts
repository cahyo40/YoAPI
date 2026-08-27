import test from "node:test";
import assert from "node:assert/strict";
import { applyEquatable } from "./equatable.ts";

const PLAIN = `import 'dart:convert';

class User {
    int id;
    String name;

    User({
        required this.id,
        required this.name,
    });
}

class Meta {
    double score;

    Meta({
        required this.score,
    });
}`;

test("tiap class extends Equatable + props dari konstruktor", () => {
  const r = applyEquatable(PLAIN);
  assert.ok(r.includes("class User extends Equatable {"));
  assert.ok(r.includes("class Meta extends Equatable {"));
  assert.ok(r.includes("List<Object?> get props => [id, name];"));
  assert.ok(r.includes("List<Object?> get props => [score];"));
});

test("import equatable disisipkan sekali", () => {
  const r = applyEquatable(PLAIN);
  const count = r.split("import 'package:equatable/equatable.dart';").length - 1;
  assert.equal(count, 1);
  // idempoten: jalankan lagi tak menggandakan import
  assert.equal(
    applyEquatable(r).split("import 'package:equatable/equatable.dart';").length - 1,
    1
  );
});

test("input tanpa class dikembalikan apa adanya", () => {
  assert.equal(applyEquatable("// no class here"), "// no class here");
});
