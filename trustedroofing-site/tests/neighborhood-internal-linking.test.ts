import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homepage = readFileSync("app/(marketing)/page.tsx", "utf8");
const serviceAreaIndex = readFileSync(
  "app/(marketing)/service-areas/page.tsx",
  "utf8",
);
const homepageAreas = readFileSync("components/home/ServiceAreas.tsx", "utf8");

test("homepage internally links every discovered Calgary neighborhood", () => {
  assert.match(homepage, /getAllNeighborhoodActivities\(\)/);
  assert.doesNotMatch(homepage, /getTopQuoteNeighborhoods|\.slice\(0,\s*20\)/);
  assert.match(homepage, /areas\.filter\(\(area\) => area\.city === "Calgary"\)/);
  assert.match(homepageAreas, /href=\{`\/service-areas\/\$\{slug\}`\}/);
});

test("service-area index internally links every discovered neighborhood", () => {
  assert.match(serviceAreaIndex, /getAllNeighborhoodActivities\(\)/);
  assert.doesNotMatch(serviceAreaIndex, /getTopNeighborhoodActivities|\.slice\(/);
  assert.match(
    serviceAreaIndex,
    /areas\.map\(\(area\)[\s\S]*href=\{`\/service-areas\/\$\{area\.slug\}`\}/,
  );
});
