import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateRoofRejuvenationQuote,
  parsePitchRise,
  pitchRiseFromDegrees,
  roofRejuvenationRateForPitch
} from "../lib/roof-rejuvenation";

test("prices every pitch boundary", () => {
  assert.deepEqual([6, 7, 8, 9, 10, 13].map(roofRejuvenationRateForPitch), [1, 1.15, 1.2, 1.25, 1.4, 1.4]);
});

test("converts degrees with the instant quote rounding logic", () => {
  assert.equal(pitchRiseFromDegrees(26.565), 6);
  assert.equal(pitchRiseFromDegrees(39.806), 10);
});

test("parses pitch ratios and gives pitchRatio priority", () => {
  assert.equal(parsePitchRise(" 8 / 12 "), 8);
  assert.equal(calculateRoofRejuvenationQuote({ roofAreaSqft: 1600, pitchRatio: "8/12", pitchDegrees: 0 }).pitchRise, 8);
});

test("applies minimum and rounds upward", () => {
  assert.equal(calculateRoofRejuvenationQuote({ roofAreaSqft: 1200, pitchRatio: "5/12" }).price, 1595);
  assert.equal(calculateRoofRejuvenationQuote({ roofAreaSqft: 1500, pitchRatio: "6/12" }).price, 1595);
  assert.equal(calculateRoofRejuvenationQuote({ roofAreaSqft: 1600, pitchRatio: "6/12" }).price, 1600);
  assert.equal(calculateRoofRejuvenationQuote({ roofAreaSqft: 1600, pitchRatio: "8/12" }).price, 1925);
  assert.equal(calculateRoofRejuvenationQuote({ roofAreaSqft: 1899, pitchRatio: "8/12" }).price, 2300);
  assert.equal(calculateRoofRejuvenationQuote({ roofAreaSqft: 1882, pitchRatio: "7/12" }).price, 2175);
  assert.equal(calculateRoofRejuvenationQuote({ roofAreaSqft: 2500, pitchRatio: "10/12" }).price, 3500);
  assert.equal(calculateRoofRejuvenationQuote({ roofAreaSqft: 2500, pitchRatio: "14/12" }).price, 3500);
});

test("rejects invalid inputs", () => {
  assert.throws(() => calculateRoofRejuvenationQuote({ roofAreaSqft: 0, pitchRatio: "6/12" }));
  assert.throws(() => calculateRoofRejuvenationQuote({ roofAreaSqft: 1000, pitchRatio: "steep" }));
  assert.throws(() => calculateRoofRejuvenationQuote({ roofAreaSqft: 1000 }));
  assert.throws(() => pitchRiseFromDegrees(90));
  assert.throws(() => roofRejuvenationRateForPitch(-1));
});
