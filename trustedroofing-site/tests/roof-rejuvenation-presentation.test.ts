import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const quoteFlow = readFileSync("components/QuoteFlow.tsx", "utf8");
const promo = readFileSync("components/home/RoofRejuvenationPromo.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");

test("quote card retains both actions and its complete selected state", () => {
  assert.match(quoteFlow, />Choose Roof Rejuvenation<\/button>/);
  assert.match(quoteFlow, />Continue With Roof Replacement<\/button>/);
  assert.match(quoteFlow, /rejuvenation-quote-card--selected/);
  assert.match(quoteFlow, /aria-pressed=\{serviceInterest === "roof_rejuvenation"\}/);
  assert.match(quoteFlow, /rejuvenation-quote-price/);
  assert.match(quoteFlow, /Current roof replacement estimate/);
  assert.match(quoteFlow, /Potential price difference/);
});

test("homepage promotion retains two independently visible actions", () => {
  assert.match(promo, />Check My Roof<\/Link>/);
  assert.match(promo, />Learn About Roof Rejuvenation<\/Link>/);
  assert.match(promo, /rejuvenation-promo-action--primary/);
  assert.match(promo, /rejuvenation-promo-action--secondary/);
});

test("scoped secondary actions have visible default and focus styles", () => {
  assert.match(styles, /\.rejuvenation-quote-action--secondary,[\s\S]*?color: var\(--navy\);[\s\S]*?background: var\(--white\);[\s\S]*?border-color: var\(--blue\);/);
  assert.match(styles, /\.home-rejuvenation-promo__card a\.rejuvenation-promo-action--secondary/);
  assert.match(styles, /\.rejuvenation-quote-action:focus-visible,[\s\S]*?outline: 3px solid var\(--gold\);/);
  assert.match(styles, /@media \(max-width: 600px\)[\s\S]*?\.rejuvenation-quote-comparison[\s\S]*?grid-template-columns: 1fr;/);
});
