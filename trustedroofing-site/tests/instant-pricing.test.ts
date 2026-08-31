import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateHardieRange,
  calculateRoofEstimate,
  getFacetAdjustment,
  getPitchSurchargePerSquare
} from "../lib/quote";

test("Cranford benchmark uses normalized section pitch surcharge", () => {
  const estimate = calculateRoofEstimate({
    roofAreaSqft: 2416,
    facetCount: 7,
    pitchSections: [
      { areaSqft: 1352, pitchRatio: 4 },
      { areaSqft: 1024, pitchRatio: 7 }
    ]
  });

  assert.ok(Math.abs(estimate.pitchSurcharge - 104.12) < 0.01);
  assert.ok(Math.abs(estimate.center - 14399.26) < 0.01);
  assert.deepEqual({ low: estimate.low, high: estimate.high }, { low: 13550, high: 15250 });
});

test("the installed baseline includes normal 5/12 installation", () => {
  const estimate = calculateRoofEstimate({ roofAreaSqft: 2416, facetCount: 5, pitchRatio: 5 });
  assert.equal(estimate.center, 2416 / 100 * 580);
  assert.equal(estimate.pitchSurcharge, 0);
});

test("facet adjustments increase continuously from five through eight facets", () => {
  assert.deepEqual([5, 6, 7, 8].map(getFacetAdjustment), [0, 0.01, 0.02, 0.03]);
});

test("pitch surcharge follows Brandon's installation rate increments", () => {
  assert.deepEqual(
    [4, 5, 6, 7, 8, 9, 10, 11, 12].map(getPitchSurchargePerSquare),
    [0, 0, 0, 10, 20, 30, 40, 50, 60]
  );
});

test("measurement source cannot alter instant roof pricing", () => {
  const common = { roofAreaSqft: 2416, facetCount: 7, pitchRatio: 7 };
  const googleSolar = calculateRoofEstimate({ ...common, dataSource: "GOOGLE_SOLAR" });
  const roofr = calculateRoofEstimate({ ...common, dataSource: "ROOFR" });
  assert.deepEqual(googleSolar, roofr);
});

test("Hardie range derives canonically from the vinyl range", () => {
  assert.deepEqual(calculateHardieRange(30000, 36000), { low: 45000, high: 64800 });
});
