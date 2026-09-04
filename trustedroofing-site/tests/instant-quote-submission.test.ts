import test from "node:test";
import assert from "node:assert/strict";
import { primarySubmittedRange } from "../lib/instantQuoteSubmission";

const ranges = {
  goodLow: 15_500,
  goodHigh: 18_200,
  eavesLow: 1_504,
  eavesHigh: 1_880,
  sidingLow: 21_424,
  sidingHigh: 25_441
};

test("eavestrough submissions persist the customer-visible eavestrough range", () => {
  assert.deepEqual(primarySubmittedRange({ ...ranges, serviceScope: "eavestrough" }), {
    low: 1_504,
    high: 1_880
  });
});

test("primary submission range follows the requested service", () => {
  assert.deepEqual(primarySubmittedRange({ ...ranges, serviceScope: "roofing" }), { low: 15_500, high: 18_200 });
  assert.deepEqual(primarySubmittedRange({ ...ranges, serviceScope: "vinyl_siding" }), { low: 21_424, high: 25_441 });
  assert.deepEqual(primarySubmittedRange({ ...ranges, serviceScope: "all" }), { low: 38_428, high: 45_521 });
});

test("incomplete selected ranges are not replaced by an unrelated roof range", () => {
  assert.deepEqual(primarySubmittedRange({ ...ranges, serviceScope: "eavestrough", eavesHigh: undefined }), {
    low: 1_504,
    high: null
  });
});
