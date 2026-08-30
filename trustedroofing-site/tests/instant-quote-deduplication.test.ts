import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const estimateRoute = readFileSync("app/api/instaquote/estimate/route.ts", "utf8");
const database = readFileSync("lib/db.ts", "utf8");
const migration = readFileSync("supabase/migrations/0033_deduplicate_instant_quotes.sql", "utf8");

test("repeat estimates refresh the existing address and service quote", () => {
  assert.match(estimateRoute, /findInstaquoteAddressQuery\(\{/);
  assert.match(estimateRoute, /refreshInstaquoteAddressQuery\(addressQueryId/);
  assert.match(database, /\.eq\("service_type", input\.service_type\)[\s\S]*\.ilike\("address"/);
  assert.match(database, /\.update\(\{[\s\S]*quote_low: payload\.quote_low,[\s\S]*created_at: payload\.created_at/);
});

test("database prevents concurrent duplicate address and quote-type rows", () => {
  assert.match(migration, /instant_quotes_address_service_unique/);
  assert.match(migration, /instaquote_queries_address_service_unique/);
  assert.match(migration, /partition by address_key, coalesce\(service_type, ''\)/);
});

test("missing forward-geocoder neighborhoods are reverse geocoded", () => {
  assert.match(estimateRoute, /reverseGeocodeNeighborhood\(lat, lng\)/);
  assert.match(estimateRoute, /neighbourhood \?\? payload\.address\?\.suburb \?\? payload\.address\?\.hamlet/);
});
