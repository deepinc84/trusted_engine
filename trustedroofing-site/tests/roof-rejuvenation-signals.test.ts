import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { quoteMaterialLabel } from "../lib/serviceAreas";

const quoteFlow = readFileSync("components/QuoteFlow.tsx", "utf8");
const estimateRoute = readFileSync("app/api/instaquote/estimate/route.ts", "utf8");
const saveLeadRoute = readFileSync("app/api/instaquote/save-lead/route.ts", "utf8");

test("rejuvenation intent is sent to quote persistence and GA attribution", () => {
  assert.match(quoteFlow, /serviceScope: selectedScope, serviceInterest/);
  assert.match(quoteFlow, /trackingLabel = serviceInterest === "roof_rejuvenation" \? "Roof rejuvenation"/);
  assert.match(quoteFlow, /serviceInterest !== "roof_rejuvenation"/);
});

test("rejuvenation quote archive stores its service and fixed treatment price", () => {
  assert.match(estimateRoute, /isRejuvenationQuote \? "Roof Rejuvenation"/);
  assert.match(estimateRoute, /\? \{ low: rejuvenation\.price, high: rejuvenation\.price \}/);
  assert.match(saveLeadRoute, /body\.serviceInterest === "roof_rejuvenation" && typeof body\.rejuvenationPrice === "number"/);
});

test("public quote signals label rejuvenation separately from replacement roofing", () => {
  assert.equal(quoteMaterialLabel("Roof Rejuvenation", ["roofing"]), "Roof rejuvenation");
  assert.equal(quoteMaterialLabel("InstantQuote:Roof", ["roofing"]), "Roofing");
});
