import assert from "node:assert/strict";
import test from "node:test";
import { GOOGLE_BUSINESS_URL, ORGANIZATION_ID, ORGANIZATION_SAME_AS, organizationProfile, organizationSchema } from "../lib/organization";
import { buildMetadata } from "../lib/seo";

test("publishes the verified organization contact details", () => {
  const business = organizationSchema["@graph"][0];
  assert.equal(business["@id"], ORGANIZATION_ID);
  assert.equal(business, organizationProfile);
  assert.equal(organizationSchema.name, business.name);
  assert.equal(organizationSchema.url, business.url);
  assert.equal(organizationSchema.telephone, business.telephone);
  assert.equal(ORGANIZATION_ID, "https://www.trustedroofingcalgary.com/#organization");
  assert.equal(business.url, "https://www.trustedroofingcalgary.com/");
  assert.equal(business.telephone, "+1-587-288-3351");
  assert.equal(business.logo, "https://www.trustedroofingcalgary.com/transparent-logo.png");
  assert.equal(business.hasMap, GOOGLE_BUSINESS_URL);
  assert.deepEqual(business.sameAs, ORGANIZATION_SAME_AS);
  assert.deepEqual(business.sameAs, [
    GOOGLE_BUSINESS_URL,
    "https://facebook.com/TrustedRoofingCalgary",
    "https://www.linkedin.com/company/trusted-roofing-exteriors/",
    "https://trustedpros.ca/company/trusted-roofing-and-exteriors",
    "https://m.yelp.ca/biz/trusted-roofing-and-exteriors-calgary",
    "https://www.homestars.com/profile/trusted-roofing-and-exteriors-inc"
  ]);
  assert.equal("geo" in business, false);
});

test("adds a branded image to Open Graph and Twitter metadata by default", () => {
  const metadata = buildMetadata({ title: "Test page", description: "Test description", path: "/test" });
  assert.deepEqual(metadata.openGraph?.images, [{
    url: "https://www.trustedroofingcalgary.com/opengraph-image",
    width: 1200,
    height: 630,
    alt: "Trusted Roofing & Exteriors in Calgary"
  }]);
  assert.deepEqual(metadata.twitter?.images, ["https://www.trustedroofingcalgary.com/opengraph-image"]);
  assert.equal((metadata.twitter as { card?: string })?.card, "summary_large_image");
});
