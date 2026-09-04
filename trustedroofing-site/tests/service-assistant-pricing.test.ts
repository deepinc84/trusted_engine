import test from "node:test";
import assert from "node:assert/strict";
import { calculatePricing } from "../lib/service-assistant/pricing-engine";

const totals = (request: Parameters<typeof calculatePricing>[0]) => { const r = calculatePricing(request); return [r.low, r.high]; };
test("attendance only", () => assert.deepEqual(totals({ rule: "attendance" }), [295,295]));
test("unlisted 1.5 technician-hours", () => assert.deepEqual(totals({ rule: "unlisted", estimatedTechHours: 1.5 }), [512.5,512.5]));
test("generic inspection", () => assert.deepEqual(totals({ rule: "inspection" }), [395,395]));
test("roof inspection pitch boundaries", () => { assert.deepEqual(totals({ rule:"roof_inspection",pitch:5 }),[395,395]); assert.deepEqual(totals({ rule:"roof_inspection",pitch:7 }),[495,495]); assert.deepEqual(totals({ rule:"roof_inspection",pitch:10 }),[645,645]); });
test("emergency 10/12 roof inspection", () => assert.deepEqual(totals({ rule:"roof_inspection",pitch:10,urgency:"emergency" }),[1451.25,1451.25]));
test("siding piece curve", () => { assert.deepEqual(totals({rule:"siding_piece",quantity:1}),[470,470]); assert.deepEqual(totals({rule:"siding_piece",quantity:3}),[595,595]); });
test("four vents on normal 5/12 roof", () => assert.deepEqual(totals({rule:"roof_vent",quantity:4,pitch:5}),[595,595]));
test("eavestrough minimum includes visit", () => assert.deepEqual(totals({rule:"eavestrough",linearFeet:100}),[1150,1150]));
test("150 LF eavestrough", () => assert.deepEqual(totals({rule:"eavestrough",linearFeet:150}),[1612.5,1625]));
test("100 LF standalone gutter guard", () => assert.deepEqual(totals({rule:"gutter_guard",linearFeet:100}),[1495,1495]));
test("emergency pitch access and boom stack exactly", () => assert.deepEqual(totals({rule:"custom_roof_repair",baseWorkLow:500,pitch:10,accessClass:"elevated",urgency:"emergency",boomRequired:true}),[3688.75,4188.75]));
test("pitch over 12 requires manual review", () => assert.equal(calculatePricing({rule:"roof_vent",pitch:13}).manualReviewRequired,true));
