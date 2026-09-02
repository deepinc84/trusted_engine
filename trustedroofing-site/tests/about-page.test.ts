import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { activeBusinessProfiles, businessProfiles } from "../data/businessProfiles";
import { ORGANIZATION_ID } from "../lib/organization";

const aboutPage = readFileSync("app/(marketing)/about/page.tsx", "utf8");
const profileSection = readFileSync("components/about/BusinessProfilesSection.tsx", "utf8");
const sitemap = readFileSync("app/api/sitemap/route.ts", "utf8");
const footer = readFileSync("components/site/SiteFooter.tsx", "utf8");

test("about page keeps permanent metadata and references the shared organization", () => {
  assert.match(aboutPage, /title: "About Trusted Roofing & Exteriors \| Calgary Roofing Contractor"/);
  assert.match(aboutPage, /path: "https:\/\/trustedroofingcalgary\.com\/about"/);
  assert.match(aboutPage, /about: \{ "@id": ORGANIZATION_ID \}/);
  assert.equal(ORGANIZATION_ID, "https://www.trustedroofingcalgary.com/#organization");
});

test("citation data has 17 confirmed records rendered as direct links", () => {
  assert.equal(businessProfiles.length, 17);
  assert.equal(activeBusinessProfiles.length, 17);
  assert.ok(activeBusinessProfiles.every((profile) => profile.active && profile.url.startsWith("https://")));
  assert.ok(activeBusinessProfiles.every((profile) => !profile.url.includes("utm_")));
  assert.match(profileSection, /activeBusinessProfiles\.map/);
  assert.match(profileSection, /href=\{profile\.url\}/);
  assert.match(profileSection, /rel="noopener noreferrer"/);
  assert.doesNotMatch(profileSection, /nofollow|sponsored/);
});

test("about is discoverable without adding another route", () => {
  assert.match(sitemap, /https:\/\/trustedroofingcalgary\.com\/about/);
  assert.match(footer, /href="\/about"/);
  assert.doesNotMatch(aboutPage, /noindex/);
});
