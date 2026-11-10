import assert from "node:assert/strict";
import test from "node:test";
import { escapeHtml } from "../src/lib/html-escape.mjs";

test("escapes HTML script markup", () => {
  assert.equal(escapeHtml("<script>alert(1)</script>"), "&lt;script&gt;alert(1)&lt;/script&gt;");
});

test("escapes apostrophes and ampersands", () => {
  assert.equal(escapeHtml("O'Brien & Sons"), "O&#39;Brien &amp; Sons");
});

test("returns an empty string for nullish values", () => {
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
});

test("preserves plain text", () => {
  assert.equal(escapeHtml("Postgraduate alumnus"), "Postgraduate alumnus");
});
