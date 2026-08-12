import assert from "node:assert/strict";
import test from "node:test";
import { appendJourney, classifySource, makeTouch, normalizeAttributionMetadata, safePath, summarizeQuoteHistory } from "../lib/attribution";

const source = (url: string, referrer = "") => makeTouch(url, referrer).source_category;
test("classifies supported acquisition sources centrally", () => {
  assert.equal(source("https://trusted.ca/", "https://www.google.com/"), "google_organic");
  assert.equal(source("https://trusted.ca/", "https://www.bing.com/search?q=roof"), "bing_organic");
  assert.equal(source("https://trusted.ca/?utm_source=google&utm_medium=organic&utm_campaign=gbp"), "google_business_profile");
  assert.equal(source("https://trusted.ca/?gclid=secret"), "google_ads");
  assert.equal(source("https://trusted.ca/?fbclid=secret"), "meta_ads");
  assert.equal(source("https://trusted.ca/", "https://example.com/page"), "referral");
  assert.equal(source("https://trusted.ca/"), "direct");
  assert.equal(classifySource({ referrer:null, utm_source:"newsletter", utm_medium:"email", utm_campaign:null, gclid:null, fbclid:null, msclkid:null }), "email");
});

test("canonical paths remove tracking values but preserve useful query", () => {
  assert.equal(safePath("https://trusted.ca/services/roof?utm_source=google&style=metal&gclid=x"), "/services/roof?style=metal");
});

test("first touch survives a direct return while last touch updates", () => {
  const first = makeTouch("https://trusted.ca/services/roof", "https://google.com/");
  const last = makeTouch("https://trusted.ca/online-estimate", "");
  const metadata = normalizeAttributionMetadata({ attribution: { visitor_id:"v", session_id:"s2", first_seen_at:"2026-08-11T18:00:00Z", session_started_at:"2026-08-12T18:00:00Z", visit_count:2, is_returning_visitor:true, first_touch:first, last_touch:last, journey:[] } });
  assert.equal(metadata.first_source_category, "google_organic"); assert.equal(metadata.last_source_category, "direct"); assert.equal(metadata.is_returning_visitor, true);
});

test("journey survives navigation and is compact", () => {
  let events: any[] = [];
  events = appendJourney(events, { event:"landing", path:"/services/roof", at:"1" });
  events = appendJourney(events, { event:"estimator_started", path:"/online-estimate", at:"2" });
  assert.deepEqual(events.map(x => x.path), ["/services/roof", "/online-estimate"]);
});

test("roof then siding and a different visitor at the same address are summarized without contacts", () => {
  const roof = { id:"q1", service_type:"InstantQuote:Roof", created_at:"2026-08-11T18:19:00Z", address:"1 Main St" };
  const returning = summarizeQuoteHistory([roof], [roof], Date.parse("2026-08-11T20:19:00Z"));
  assert.equal(returning.previous_quote_services[0], "InstantQuote:Roof"); assert.equal(returning.previous_quote_same_address, true);
  const differentBrowser = summarizeQuoteHistory([], [roof]);
  assert.equal(differentBrowser.previous_quote_count, 0); assert.equal(differentBrowser.number_of_quotes_same_address, 1); assert.equal("email" in differentBrowser, false);
});

test("missing or legacy attribution is safe", () => {
  assert.deepEqual(normalizeAttributionMetadata(undefined), {});
  assert.deepEqual(normalizeAttributionMetadata({ referrer:"legacy" }), {});
});
