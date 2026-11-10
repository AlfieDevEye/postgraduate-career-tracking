import test from "node:test";
import assert from "node:assert/strict";
import { stepStatus } from "../src/lib/step-status.mjs";
const run = (current, total = 5) => Array.from({ length: total }, (_, i) => stepStatus(i, current));
test("first step: nothing complete", () => {
  assert.deepEqual(run(0), ["current", "upcoming", "upcoming", "upcoming", "upcoming"]);
});
test("resuming at step 4 marks steps 1-3 complete", () => {
  assert.deepEqual(run(3), ["complete", "complete", "complete", "current", "upcoming"]);
});
test("all steps complete after submit", () => {
  assert.deepEqual(run(5), ["complete", "complete", "complete", "complete", "complete"]);
});
