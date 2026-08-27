import { test } from "node:test";
import assert from "node:assert/strict";
import { classNameFromUrl } from "./classNameFromUrl.ts";

test("classNameFromUrl", () => {
  assert.equal(classNameFromUrl("https://api.example.com/users/123"), "User");
  assert.equal(classNameFromUrl("https://api.example.com/api/v2/blog-posts"), "BlogPost");
  assert.equal(classNameFromUrl("https://api.example.com/"), "Model");
  // segment numerik dilewati, ambil yang sebelumnya
  assert.equal(classNameFromUrl("https://api.example.com/user-profile/42"), "UserProfile");
  // URL invalid → fallback
  assert.equal(classNameFromUrl("bukan-url"), "Model");
});
