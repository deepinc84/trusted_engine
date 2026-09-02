import assert from "node:assert/strict";
import test from "node:test";

const nextConfig = require("../next.config.js");

test("legacy Harvest Hills URL permanently redirects to its service-area page", async () => {
  const redirects = await nextConfig.redirects();
  const harvestHillsRedirect = redirects.find(
    (redirect: { source: string }) => redirect.source === "/harvest-hills"
  );

  assert.deepEqual(harvestHillsRedirect, {
    source: "/harvest-hills",
    destination: "/service-areas/harvest-hills",
    statusCode: 301
  });
});
