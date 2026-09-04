"use client";

import { ensureBrowserAttribution, safePath, type AttributionSnapshot } from "@/lib/attribution";

export const GA_MEASUREMENT_ID = "G-D895RE5E8H";
export const CONSENT_STORAGE_KEY = "trusted_consent_v1";
export type ConsentChoice = { analytics: boolean; ads: boolean; decidedAt: string };
export type AnalyticsEventName = "page_view" | "start_quote" | "generate_quote" | "generate_lead" | "click_call" | "click_email" | "click_get_quote" | "form_submit" | "quote_pdf_downloaded" | "view_service";
export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

const PII_KEYS = /(^|_)(name|email|phone|address|street|postal|note|message|quote_id|event_id)($|_)/i;
const sent = new Map<string, number>();

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

export function getConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) || "null") as ConsentChoice | null; } catch { return null; }
}

export function setConsent(analytics: boolean, ads: boolean) {
  if (typeof window === "undefined") return;
  const choice = { analytics, ads, decidedAt: new Date().toISOString() };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(choice));
  window.gtag?.("consent", "update", {
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: ads ? "granted" : "denied",
    ad_user_data: ads ? "granted" : "denied",
    ad_personalization: ads ? "granted" : "denied"
  });
  window.dispatchEvent(new CustomEvent("trusted-consent-change", { detail: choice }));
}

export function sanitizeAnalyticsParams(params: AnalyticsParams): AnalyticsParams {
  const clean: AnalyticsParams = {};
  for (const [key, raw] of Object.entries(params)) {
    if (PII_KEYS.test(key) || raw === null || raw === undefined || raw === "") continue;
    if (typeof raw === "number") { if (Number.isFinite(raw)) clean[key] = raw; continue; }
    if (typeof raw === "boolean") { clean[key] = raw; continue; }
    clean[key] = (key.includes("page") || key === "destination" ? safePath(raw) : raw.slice(0, 100));
  }
  return clean;
}

function context(snapshot: AttributionSnapshot | null): AnalyticsParams {
  const touch = snapshot?.last_touch;
  const derivedMedium = touch?.source_category?.includes("organic") ? "organic" : touch?.source_category === "referral" ? "referral" : touch?.source_category === "direct" ? "(none)" : undefined;
  return { landing_page: touch?.landing_path, source: touch?.utm_source || touch?.source_category, medium: touch?.utm_medium || derivedMedium, campaign: touch?.utm_campaign };
}

export function trackEvent(eventName: AnalyticsEventName, params: AnalyticsParams = {}, options: { dedupeKey?: string; ga?: boolean } = {}) {
  if (typeof window === "undefined") return;
  const snapshot = ensureBrowserAttribution();
  const clean = sanitizeAnalyticsParams({ ...context(snapshot), ...params });
  const key = options.dedupeKey || `${eventName}:${JSON.stringify(clean)}`;
  const now = Date.now();
  if (!getConsent()?.analytics) {
    if (process.env.NODE_ENV === "development") console.debug("[analytics:consent-blocked]", eventName, clean);
    return;
  }
  if ((sent.get(key) || 0) > now - 1500) return;
  sent.set(key, now);
  {
    if (options.ga !== false) window.gtag?.("event", eventName, { ...clean, debug_mode: process.env.NODE_ENV === "development" });
    void fetch("/api/analytics/events", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ eventName, params: clean, attribution: snapshot, eventId: crypto.randomUUID(), occurredAt: new Date().toISOString(), pageTitle: document.title }) });
  }
  if (process.env.NODE_ENV === "development") console.debug("[analytics]", eventName, clean);
}

export const trackStartQuote = (service: string, ctaLocation?: string) => trackEvent("start_quote", { service, cta_location: ctaLocation, page_path: location.pathname });
export const trackGenerateQuote = (p: { service: string; city?: string; low: number; high: number; status?: string; contactSubmitted?: boolean }) => trackEvent("generate_quote", { service: p.service, city: p.city, estimate_low: p.low, estimate_high: p.high, estimate_midpoint: (p.low + p.high) / 2, value: (p.low + p.high) / 2, currency: "CAD", quote_status: p.status || "generated", contact_submitted: Boolean(p.contactSubmitted), page_path: location.pathname });
export const trackGenerateLead = (p: { service: string; city?: string; low?: number; high?: number; status?: string }) => { const midpoint = p.low !== undefined && p.high !== undefined ? (p.low + p.high) / 2 : undefined; trackEvent("generate_lead", { service: p.service, city: p.city, quote_status: p.status || "submitted", estimate_midpoint: midpoint, value: midpoint, currency: "CAD", page_path: location.pathname }); };
export const trackQuoteCTA = (ctaLocation: string, destination: string) => trackEvent("click_get_quote", { page_path: location.pathname, cta_location: ctaLocation, destination: safePath(destination) });
