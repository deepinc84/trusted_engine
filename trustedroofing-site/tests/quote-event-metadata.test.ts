import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dbSource = fs.readFileSync("lib/db.ts", "utf8");

test("lead submission preserves quote measurement metadata", () => {
  const leadUpdate = dbSource
    .split("export async function createInstaquoteLead")[1]
    .split("if (linkedInstantQuote)")[0];

  assert.match(leadUpdate, /status: "instaquote_lead_submitted"/);
  assert.doesNotMatch(leadUpdate, /notes:/);
});

test("published quote cards recover metadata from the address query", () => {
  const recentQuotes = dbSource.split(
    "export async function listRecentInstaquoteAddressQueries",
  )[1];

  assert.match(recentQuotes, /from\("instaquote_address_queries"\)/);
  assert.match(recentQuotes, /addressQueriesById/);
  assert.match(recentQuotes, /addressQuery\.roof_area_sqft/);
  assert.match(recentQuotes, /addressQuery\.complexity_band/);
  assert.match(recentQuotes, /addressQuery\.queried_at/);
});
