import { calculateRoofRejuvenationQuote } from "@/lib/roof-rejuvenation";
import { getAllQuoteCards } from "@/lib/seo-engine";
import PageContainer from "@/components/ui/PageContainer";

function weeklyKey(date = new Date()) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return utc.getUTCFullYear() * 100 + Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function score(value: string, seed: number) {
  let result = seed;
  for (const char of value) result = ((result << 5) - result + char.charCodeAt(0)) | 0;
  return result >>> 0;
}

export default async function RoofRejuvenationComparisons() {
  const valid = (await getAllQuoteCards()).filter((quote) => {
    const scope = `${quote.material} ${quote.serviceType ?? ""} ${(quote.requestedScopes ?? []).join(" ")}`.toLowerCase();
    return (scope.includes("roof") || scope.includes("shingle"))
      && typeof quote.roofAreaSqft === "number" && typeof quote.pitchDegrees === "number"
      && typeof quote.estimateLow === "number" && typeof quote.estimateHigh === "number";
  }).sort((a, b) => score(a.id, weeklyKey()) - score(b.id, weeklyKey()));
  const used = new Set<string>();
  const selected = valid.filter((quote) => {
    const key = quote.neighborhood.toLowerCase();
    if (used.has(key)) return false;
    used.add(key);
    return true;
  }).slice(0, 5);

  if (!selected.length) return null;
  return <section className="ui-page-section"><PageContainer><p className="homev3-eyebrow">Recent modeled quote comparisons</p><h2>Roof preservation pricing from recent quote measurements</h2><div className="ui-grid ui-grid--services">{selected.map((quote) => {
    const rejuvenation = calculateRoofRejuvenationQuote({ roofAreaSqft: quote.roofAreaSqft!, pitchDegrees: quote.pitchDegrees! });
    return <article className="ui-card" key={quote.id}><h3>{quote.neighborhood}</h3><p>{Math.round(quote.roofAreaSqft!).toLocaleString()} sq. ft. | {rejuvenation.pitchRatio}</p><p><strong>Replacement:</strong> ${quote.estimateLow!.toLocaleString()} to ${quote.estimateHigh!.toLocaleString()}</p><p><strong>Fixed rejuvenation:</strong> ${rejuvenation.price.toLocaleString()}</p><p><strong>Potential price difference:</strong> ${Math.max(0, quote.estimateLow! - rejuvenation.price).toLocaleString()} to ${Math.max(0, quote.estimateHigh! - rejuvenation.price).toLocaleString()}</p></article>;
  })}</div></PageContainer></section>;
}
