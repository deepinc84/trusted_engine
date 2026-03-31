import { NextResponse } from "next/server";
import { listAdminInstantQuotes } from "@/lib/db";

const SERVICE_TYPE_TO_SLUG: Record<string, string> = {
  "InstantQuote:Roof": "roofing",
  "InstantQuote:Eaves": "gutters",
  "InstantQuote:Hardie": "hardie-siding",
  "InstantQuote:Vinyl": "vinyl-siding",
  "InstantQuote:Siding": "siding"
};

function normalizeServiceSlug(value: string | null) {
  if (!value) return "";
  return value.trim().toLowerCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const serviceSlug = normalizeServiceSlug(searchParams.get("service_slug"));
  const parsedLimit = Number(searchParams.get("limit") ?? "30");
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(100, Math.trunc(parsedLimit)))
    : 30;

  const quotes = await listAdminInstantQuotes({
    status: "all",
    q: q || null,
    limit: 500
  });

  const filtered = quotes
    .filter((quote) => !quote.project_id)
    .filter((quote) => {
      if (!serviceSlug) return true;
      const mapped = normalizeServiceSlug(SERVICE_TYPE_TO_SLUG[quote.service_type ?? ""] ?? quote.service_type ?? null);
      return mapped === serviceSlug;
    })
    .slice(0, limit)
    .map((quote) => ({
      id: quote.id,
      address: quote.address,
      service_type: quote.service_type,
      quote_low: quote.quote_low,
      quote_high: quote.quote_high,
      created_at: quote.created_at
    }));

  return NextResponse.json({ quotes: filtered });
}
