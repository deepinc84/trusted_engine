import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/db";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { normalizeAttributionMetadata, safePath } from "@/lib/attribution";

const ALLOWED_EVENTS = new Set(["page_view", "start_quote", "generate_quote", "generate_lead", "click_call", "click_email", "click_get_quote", "form_submit", "quote_pdf_downloaded", "view_service"]);
const PII_KEYS = /(^|_)(name|email|phone|address|street|postal|note|message|quote_id)($|_)/i;

function safeParams(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw as Record<string, unknown>).filter(([key, value]) => !PII_KEYS.test(key) && (["string", "number", "boolean"].includes(typeof value))).slice(0, 30).map(([key, value]) => [key.slice(0, 40), typeof value === "string" ? value.slice(0, 200) : value]));
}

export async function POST(request: Request) {
  const limit = checkRateLimit(`analytics:${requestIp(request)}`, 120, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many events" }, { status: 429 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const eventName = typeof body?.eventName === "string" ? body.eventName : "";
  if (!ALLOWED_EVENTS.has(eventName)) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const attribution = normalizeAttributionMetadata({ attribution: body?.attribution });
  const visitorId = typeof attribution.visitor_id === "string" ? attribution.visitor_id : null;
  const sessionId = typeof attribution.session_id === "string" ? attribution.session_id : null;
  if (!visitorId || !sessionId) return NextResponse.json({ error: "Missing anonymous context" }, { status: 400 });
  const params = safeParams(body?.params);
  const client = getServiceClient();
  if (!client) return NextResponse.json({ ok: true, stored: false });
  const first = (body?.attribution as { first_touch?: Record<string, unknown> } | undefined)?.first_touch || {};
  const latest = (body?.attribution as { last_touch?: Record<string, unknown> } | undefined)?.last_touch || {};
  const occurredAt = typeof body?.occurredAt === "string" && !Number.isNaN(Date.parse(body.occurredAt)) ? body.occurredAt : new Date().toISOString();
  await client.from("analytics_visitors").upsert({ visitor_id: visitorId, first_seen_at: attribution.first_seen_at, last_seen_at: occurredAt, first_source: first.utm_source || first.source_category, first_medium: first.utm_medium, first_campaign: first.utm_campaign, first_referrer: first.referrer, first_landing_page: first.landing_path }, { onConflict: "visitor_id", ignoreDuplicates: true });
  await client.from("analytics_visitors").update({ last_seen_at: occurredAt }).eq("visitor_id", visitorId);
  await client.from("analytics_sessions").upsert({ session_id: sessionId, visitor_id: visitorId, started_at: attribution.session_started_at, last_seen_at: occurredAt, source: latest.utm_source || latest.source_category, medium: latest.utm_medium, campaign: latest.utm_campaign, term: latest.utm_term, content: latest.utm_content, referrer: latest.referrer, landing_page: latest.landing_path, gclid: latest.gclid, gbclid: latest.gbclid, dclid: latest.dclid, msclkid: latest.msclkid, fbclid: latest.fbclid }, { onConflict: "session_id", ignoreDuplicates: false });
  const { error } = await client.from("analytics_events").insert({ event_id: typeof body?.eventId === "string" ? body.eventId.slice(0, 64) : null, visitor_id: visitorId, session_id: sessionId, event_name: eventName, event_timestamp: occurredAt, page_path: safePath(String(params.page_path || "/")), page_title: typeof body?.pageTitle === "string" ? body.pageTitle.slice(0, 200) : null, event_params: params, source: latest.utm_source || latest.source_category, medium: latest.utm_medium, campaign: latest.utm_campaign });
  if (error) return NextResponse.json({ error: "Unable to store event" }, { status: 500 });
  return NextResponse.json({ ok: true, stored: true });
}
