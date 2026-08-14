export const ATTRIBUTION_STORAGE_KEY = "trusted_attribution_v1";
export const SESSION_STORAGE_KEY = "trusted_attribution_session_v1";
export const JOURNEY_LIMIT = 20;

export type SourceCategory = "google_organic" | "bing_organic" | "google_business_profile" | "google_ads" | "meta_ads" | "referral" | "direct" | "email" | "other_organic" | "unknown";
export type JourneyEventName = "landing" | "service_page_viewed" | "project_page_viewed" | "service_area_page_viewed" | "estimator_started" | "address_submitted" | "estimate_generated" | "contact_form_shown" | "contact_submitted" | "pdf_generated" | "pdf_downloaded";
export type JourneyEvent = { event: JourneyEventName; path: string; at: string; label?: string };
export type Touch = {
  landing_path: string; referrer: string | null; referring_domain: string | null;
  utm_source: string | null; utm_medium: string | null; utm_campaign: string | null;
  utm_content: string | null; utm_term: string | null; gclid: string | null;
  fbclid: string | null; msclkid: string | null; source_category: SourceCategory;
};
export type AttributionSnapshot = {
  visitor_id: string; session_id: string; first_seen_at: string; session_started_at: string;
  visit_count: number; is_returning_visitor: boolean; first_touch: Touch; last_touch: Touch;
  journey: JourneyEvent[]; ga_client_id?: string | null; ga_session_id?: string | null;
};

const TRACKING_KEYS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "msclkid"]);
const value = (params: URLSearchParams, key: string) => params.get(key)?.slice(0, 200) || null;

export function safePath(input: string): string {
  try {
    const url = new URL(input, "https://trusted.local");
    for (const key of [...url.searchParams.keys()]) if (TRACKING_KEYS.has(key.toLowerCase())) url.searchParams.delete(key);
    return `${url.pathname}${url.searchParams.size ? `?${url.searchParams}` : ""}`.slice(0, 500);
  } catch { return "/"; }
}

export function referringDomain(referrer?: string | null): string | null {
  if (!referrer) return null;
  try { return new URL(referrer).hostname.toLowerCase().replace(/^www\./, "").slice(0, 200); } catch { return null; }
}

export function classifySource(input: Pick<Touch, "referrer" | "utm_source" | "utm_medium" | "utm_campaign" | "gclid" | "fbclid" | "msclkid">): SourceCategory {
  const source = (input.utm_source || "").toLowerCase();
  const medium = (input.utm_medium || "").toLowerCase();
  const campaign = (input.utm_campaign || "").toLowerCase();
  const domain = referringDomain(input.referrer);
  if (source === "google" && medium === "organic" && /(^|[-_])gbp($|[-_])/.test(campaign)) return "google_business_profile";
  if (input.gclid || ((source.includes("google") || source === "adwords") && /cpc|ppc|paid/.test(medium))) return "google_ads";
  if (input.fbclid || /facebook|instagram|meta/.test(source) && /cpc|ppc|paid|social/.test(medium)) return "meta_ads";
  if (/email|e-mail|newsletter/.test(medium) || source === "email") return "email";
  if (domain && /(^|\.)google\./.test(domain)) return "google_organic";
  if (domain && /(^|\.)bing\.com$/.test(domain)) return "bing_organic";
  if (medium === "organic") return "other_organic";
  if (domain) return "referral";
  if (!source && !medium && !campaign && !input.gclid && !input.fbclid && !input.msclkid) return "direct";
  return "unknown";
}

export function makeTouch(urlInput: string, referrer?: string | null): Touch {
  const url = new URL(urlInput, "https://trusted.local");
  const params = url.searchParams;
  const touch = { landing_path: safePath(url.href), referrer: referrer?.slice(0, 500) || null, referring_domain: referringDomain(referrer), utm_source: value(params,"utm_source"), utm_medium: value(params,"utm_medium"), utm_campaign: value(params,"utm_campaign"), utm_content: value(params,"utm_content"), utm_term: value(params,"utm_term"), gclid: value(params,"gclid"), fbclid: value(params,"fbclid"), msclkid: value(params,"msclkid"), source_category: "unknown" as SourceCategory };
  touch.source_category = classifySource(touch);
  return touch;
}

export function appendJourney(events: JourneyEvent[], event: JourneyEvent): JourneyEvent[] {
  const last = events[events.length - 1];
  if (last?.event === event.event && last.path === event.path) return events;
  return [...events, { ...event, path: safePath(event.path), label: event.label?.slice(0, 100) }].slice(-JOURNEY_LIMIT);
}

export function sourceLabel(source?: SourceCategory | null) {
  return ({ google_organic:"Google Organic", bing_organic:"Bing Organic", google_business_profile:"Google Business Profile", google_ads:"Google Ads", meta_ads:"Meta Ads", referral:"Referral", direct:"Direct", email:"Email", other_organic:"Other Organic", unknown:"Unknown" } as const)[source ?? "unknown"];
}

export function normalizeAttributionMetadata(raw: unknown): Record<string, unknown> {
  const input = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const attribution = input.attribution && typeof input.attribution === "object" ? input.attribution as Partial<AttributionSnapshot> : null;
  const first = attribution?.first_touch; const last = attribution?.last_touch;
  if (!attribution || !first || !last) return {};
  return {
    visitor_id: String(attribution.visitor_id || "").slice(0, 64) || null,
    session_id: String(attribution.session_id || "").slice(0, 64) || null,
    first_seen_at: attribution.first_seen_at || null,
    session_started_at: attribution.session_started_at || null,
    is_returning_visitor: Boolean(attribution.is_returning_visitor),
    previous_visit_count: Math.max(0, Number(attribution.visit_count || 1) - 1),
    source_type: sourceLabel(first.source_category), landing_page: first.landing_path,
    referrer: last.referrer, utm_source: last.utm_source, utm_medium: last.utm_medium,
    utm_campaign: last.utm_campaign, utm_term: last.utm_term, utm_content: last.utm_content,
    first_page_path: first.landing_path, current_page_path: last.landing_path,
    first_source_category: first.source_category, last_source_category: last.source_category,
    attribution, journey: Array.isArray(attribution.journey) ? attribution.journey.slice(-JOURNEY_LIMIT) : []
  };
}

export type QuoteHistoryItem = { id: string; service_type: string | null; created_at: string; address?: string };
export function summarizeQuoteHistory(browser: QuoteHistoryItem[], sameAddress: QuoteHistoryItem[], now = Date.now()) {
  const previous = sameAddress[0];
  return { previous_quote_count: browser.length, previous_quote_services: browser.map(x => x.service_type).filter(Boolean), previous_quote_timestamps: browser.map(x => x.created_at), previous_quote_same_address: Boolean(previous), previous_quote_event_id: previous?.id ?? null, previous_quote_service: previous?.service_type ?? null, previous_quote_created_at: previous?.created_at ?? null, time_since_previous_quote_ms: previous ? Math.max(0, now - new Date(previous.created_at).getTime()) : null, number_of_quotes_same_address: sameAddress.length };
}
