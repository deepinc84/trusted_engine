import assert from "node:assert/strict";
import test from "node:test";
import { GOOGLE_BUSINESS_URL, localBusinessSchema, organizationSchema } from "../lib/organization";
import { buildMetadata } from "../lib/seo";

test("publishes the verified organization contact details", () => {
  assert.equal(organizationSchema.telephone, "+1-587-288-3351");
  assert.equal(organizationSchema.logo, "https://www.trustedroofingcalgary.com/transparent-logo.png");
  assert.deepEqual(organizationSchema.sameAs, [
    "https://www.google.com/maps/place/Trusted+Roofing+and+Exteriors/@51.0276233,-114.087835,10z/data=!3m1!4b1!4m6!3m5!1s0x84f684b81f4abb19:0x8c7ab4360c4bc567!8m2!3d51.0276233!4d-114.087835!16s%2Fg%2F11z2bxxb2y"
  ]);
  assert.deepEqual(localBusinessSchema.geo, {
    "@type": "GeoCoordinates",
    latitude: 51.0276233,
    longitude: -114.087835
  });
  assert.deepEqual(localBusinessSchema.sameAs, [GOOGLE_BUSINESS_URL]);
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
