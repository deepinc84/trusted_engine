import assert from "node:assert/strict";
import test from "node:test";
import { organizationSchema } from "../lib/organization";

test("publishes the verified organization contact details", () => {
  assert.equal(organizationSchema.telephone, "+1-587-288-3351");
  assert.equal(organizationSchema.logo, "https://www.trustedroofingcalgary.com/transparent-logo.png");
  assert.deepEqual(organizationSchema.sameAs, [
    "https://www.google.com/maps/place/Trusted+Roofing+and+Exteriors/@51.0276233,-114.087835,10z/data=!3m1!4b1!4m6!3m5!1s0x84f684b81f4abb19:0x8c7ab4360c4bc567!8m2!3d51.0276233!4d-114.087835!16s%2Fg%2F11z2bxxb2y"
  ]);
});
