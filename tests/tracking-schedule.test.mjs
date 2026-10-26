import assert from "node:assert/strict";
import test from "node:test";
import { addMonths, isWithinTrackingPeriod } from "../src/lib/tracking-schedule.mjs";

test("adds calendar months and clamps month-end dates", () => {
  assert.equal(addMonths("2026-01-31", 3), "2026-04-30");
  assert.equal(addMonths("2024-01-31", 1), "2024-02-29");
  assert.equal(addMonths("2026-01-15", 9), "2026-10-15");
});

test("only active, unexpired tracking records are eligible", () => {
  const now = new Date("2026-10-20T12:00:00.000Z");
  assert.equal(isWithinTrackingPeriod(true, "2026-10-20", now), true);
  assert.equal(isWithinTrackingPeriod(false, "2027-10-20", now), false);
  assert.equal(isWithinTrackingPeriod(true, "2026-10-19", now), false);
  assert.equal(isWithinTrackingPeriod(true, null, now), false);
});
