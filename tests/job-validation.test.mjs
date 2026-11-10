import assert from "node:assert/strict";
import test from "node:test";
import { validateJobInput } from "../src/lib/job-validation.mjs";

test("accepts a valid job and defaults it to active", () => {
  const result = validateJobInput({ title: "Developer", employer: "Example Ltd" });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.is_active, true);
    assert.equal(result.value.location, null);
    assert.equal(result.value.application_url, null);
  }
});

test("rejects a missing title", () => {
  assert.deepEqual(validateJobInput({ employer: "Example Ltd" }), {
    ok: false,
    error: "Title is required.",
  });
});

test("rejects javascript URLs", () => {
  assert.equal(
    validateJobInput({ title: "Developer", employer: "Example Ltd", application_url: "javascript:alert(1)" }).ok,
    false,
  );
});

test("accepts HTTPS URLs", () => {
  const result = validateJobInput({ title: "Developer", employer: "Example Ltd", application_url: "https://example.com/jobs" });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.application_url, "https://example.com/jobs");
});

test("rejects an invalid closing date", () => {
  assert.equal(
    validateJobInput({ title: "Developer", employer: "Example Ltd", closes_at: "2026-02-30" }).ok,
    false,
  );
});

test("trims required and optional strings", () => {
  const result = validateJobInput({
    title: " Developer ",
    employer: " Example Ltd ",
    location: " Remote ",
    application_url: " https://example.com/jobs ",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.title, "Developer");
    assert.equal(result.value.employer, "Example Ltd");
    assert.equal(result.value.location, "Remote");
    assert.equal(result.value.application_url, "https://example.com/jobs");
  }
});

test("rejects over-length values", () => {
  assert.equal(validateJobInput({ title: "x".repeat(161), employer: "Example Ltd" }).ok, false);
  assert.equal(validateJobInput({ title: "Developer", employer: "x".repeat(161) }).ok, false);
  assert.equal(validateJobInput({ title: "Developer", employer: "Example Ltd", location: "x".repeat(161) }).ok, false);
  assert.equal(validateJobInput({ title: "Developer", employer: "Example Ltd", description: "x".repeat(4001) }).ok, false);
});
