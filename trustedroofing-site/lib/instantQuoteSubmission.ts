export type SubmittedQuoteRange = { low: number | null; high: number | null };

function submittedRange(body: Record<string, unknown>, lowKey: string, highKey: string): SubmittedQuoteRange {
  const low = body[lowKey];
  const high = body[highKey];
  return {
    low: typeof low === "number" && Number.isFinite(low) ? low : null,
    high: typeof high === "number" && Number.isFinite(high) ? high : null
  };
}

/** Selects the range belonging to the service the customer actually requested. */
export function primarySubmittedRange(body: Record<string, unknown>): SubmittedQuoteRange {
  const scope = body.serviceScope;
  if (scope === "eavestrough") return submittedRange(body, "eavesLow", "eavesHigh");
  if (scope === "vinyl_siding" || scope === "hardie_siding") return submittedRange(body, "sidingLow", "sidingHigh");
  if (scope === "all") {
    const roof = submittedRange(body, "goodLow", "goodHigh");
    const eaves = submittedRange(body, "eavesLow", "eavesHigh");
    const siding = submittedRange(body, "sidingLow", "sidingHigh");
    return {
      low: roof.low !== null && eaves.low !== null && siding.low !== null ? roof.low + eaves.low + siding.low : null,
      high: roof.high !== null && eaves.high !== null && siding.high !== null ? roof.high + eaves.high + siding.high : null
    };
  }
  return submittedRange(body, "goodLow", "goodHigh");
}
