import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listAdminInstantQuotes } from "@/lib/db";

const SERVICE_TYPE_TO_SLUG: Record<string, string> = {
  "InstantQuote:Roof": "roofing",
  "InstantQuote:Eaves": "gutters",
  "InstantQuote:Eavestrough": "gutters",
  "InstantQuote:Hardie": "hardie-siding",
  "InstantQuote:SidingHardie": "hardie-siding",
  "InstantQuote:Vinyl": "vinyl-siding",
  "InstantQuote:SidingVinyl": "vinyl-siding",
  "InstantQuote:Siding": "siding"
};

function normalizeServiceSlug(value: string | null) {
  if (!value) return "";
  return value.trim().toLowerCase();
}

function getQuoteEventTypesForServiceSlug(serviceSlug: string) {
  switch (serviceSlug) {
    case "roofing":
    case "roof-replacement":
    case "roof-repair":
      return ["InstantQuote:Roof"];
    case "gutters":
    case "eavestrough":
    case "eavestrough-soffit-fascia":
      return ["InstantQuote:Eavestrough", "InstantQuote:Eaves"];
    case "hardie-siding":
    case "james-hardie-siding":
      return ["InstantQuote:SidingHardie", "InstantQuote:Hardie", "InstantQuote:Siding"];
    case "vinyl-siding":
      return ["InstantQuote:SidingVinyl", "InstantQuote:Vinyl", "InstantQuote:Siding"];
    case "siding":
      return ["InstantQuote:Siding", "InstantQuote:SidingHardie", "InstantQuote:SidingVinyl", "InstantQuote:Hardie", "InstantQuote:Vinyl"];
    default:
      return [];
  }
}

function serviceSlugMatchesQuote(serviceSlug: string, serviceType: string | null) {
  if (!serviceSlug) return true;
  const quoteTypes = getQuoteEventTypesForServiceSlug(serviceSlug);
  if (serviceType && quoteTypes.includes(serviceType)) return true;
  const mapped = normalizeServiceSlug(SERVICE_TYPE_TO_SLUG[serviceType ?? ""] ?? serviceType ?? null);
  return mapped === serviceSlug;
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
  const quoteEventTypes = getQuoteEventTypesForServiceSlug(serviceSlug);

  if (supabaseUrl && serviceRole && q) {
    const client = createClient(supabaseUrl, serviceRole);

    let quoteEventQuery = client
      .from("quote_events")
      .select("id, address, service_type, created_at")
      .ilike("address", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (quoteEventTypes.length === 1) {
      quoteEventQuery = quoteEventQuery.eq("service_type", quoteEventTypes[0]);
    } else if (quoteEventTypes.length > 1) {
      quoteEventQuery = quoteEventQuery.in("service_type", quoteEventTypes);
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
    .filter((quote) => serviceSlugMatchesQuote(serviceSlug, quote.service_type))
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
