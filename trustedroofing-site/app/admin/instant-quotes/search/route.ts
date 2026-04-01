import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

function mapServiceSlugToQuoteEventType(serviceSlug: string) {
  switch (serviceSlug) {
    case "roofing":
    case "roof-repair":
      return "InstantQuote:Roof";
    case "gutters":
      return "InstantQuote:Eavestrough";
    case "hardie-siding":
      return "InstantQuote:SidingHardie";
    case "vinyl-siding":
      return "InstantQuote:SidingVinyl";
    case "siding":
      return "InstantQuote:Siding";
    default:
      return "";
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const serviceSlug = normalizeServiceSlug(searchParams.get("service_slug"));
  const parsedLimit = Number(searchParams.get("limit") ?? "30");
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(100, Math.trunc(parsedLimit)))
    : 30;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const quoteEventType = mapServiceSlugToQuoteEventType(serviceSlug);

  if (supabaseUrl && serviceRole && q) {
    const client = createClient(supabaseUrl, serviceRole);

    let quoteEventQuery = client
      .from("quote_events")
      .select("id, address, service_type, created_at")
      .ilike("address", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (quoteEventType) {
      quoteEventQuery = quoteEventQuery.eq("service_type", quoteEventType);
    }

    const { data: quoteEvents } = await quoteEventQuery;
    const quoteEventIds = (quoteEvents ?? []).map((event) => event.id);

    if (quoteEventIds.length > 0) {
      const { data: instantQuotes } = await client
        .from("instant_quotes")
        .select("id, legacy_address_query_id, address, service_type, quote_low, quote_high, project_id, created_at")
        .in("legacy_address_query_id", quoteEventIds)
        .is("project_id", null)
        .order("created_at", { ascending: false });

      const byLegacyId = new Map((instantQuotes ?? []).map((quote) => [quote.legacy_address_query_id, quote]));

      const matched = (quoteEvents ?? [])
        .map((event) => byLegacyId.get(event.id))
        .filter((quote): quote is NonNullable<typeof quote> => !!quote)
        .slice(0, limit)
        .map((quote) => ({
          id: quote.id,
          address: quote.address,
          service_type: quote.service_type,
          quote_low: quote.quote_low,
          quote_high: quote.quote_high,
          created_at: quote.created_at
        }));

      if (matched.length > 0) {
        return NextResponse.json({ quotes: matched });
      }
    }
  }

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
