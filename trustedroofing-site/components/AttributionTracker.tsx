"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { appendJourney, ATTRIBUTION_STORAGE_KEY, makeTouch, safePath, SESSION_STORAGE_KEY, type AttributionSnapshot, type JourneyEventName } from "@/lib/attribution";

declare global { interface Window { trustedAttribution?: { snapshot: () => AttributionSnapshot | null; track: (event: JourneyEventName, label?: string) => void } } }
const parse = <T,>(value: string | null): T | null => { try { return value ? JSON.parse(value) as T : null; } catch { return null; } };

export default function AttributionTracker() {
  const pathname = usePathname(); const searchParams = useSearchParams();
  useEffect(() => {
    try {
      const now = new Date().toISOString(); const url = window.location.href;
      const prior = parse<AttributionSnapshot>(localStorage.getItem(ATTRIBUTION_STORAGE_KEY));
      const storedSession = parse<{ id:string; started_at:string }>(sessionStorage.getItem(SESSION_STORAGE_KEY));
      const session = storedSession ?? { id: crypto.randomUUID(), started_at: now };
      if (!storedSession) sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      const touch = makeTouch(url, document.referrer);
      const isNewSession = !prior || prior.session_id !== session.id;
      let snapshot: AttributionSnapshot = prior ? { ...prior, session_id: session.id, session_started_at: session.started_at, visit_count: prior.visit_count + (isNewSession ? 1 : 0), is_returning_visitor: prior.visit_count > 0 && isNewSession, last_touch: isNewSession ? touch : prior.last_touch } : { visitor_id: crypto.randomUUID(), session_id: session.id, first_seen_at: now, session_started_at: session.started_at, visit_count: 1, is_returning_visitor: false, first_touch: touch, last_touch: touch, journey: [] };
      const classifyPath = (path: string): JourneyEventName | null => path.startsWith("/services/") ? "service_page_viewed" : path.startsWith("/projects/") ? "project_page_viewed" : path.startsWith("/service-areas/") ? "service_area_page_viewed" : null;
      const persist = () => localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(snapshot));
      const track = (event: JourneyEventName, label?: string) => { snapshot = { ...snapshot, journey: appendJourney(snapshot.journey || [], { event, path: safePath(location.href), at: new Date().toISOString(), label }) }; persist(); };
      if (!prior || isNewSession) track("landing");
      const pageEvent = classifyPath(pathname); if (pageEvent) track(pageEvent);
      persist(); window.trustedAttribution = { snapshot: () => snapshot, track };
    } catch { window.trustedAttribution = { snapshot: () => null, track: () => undefined }; }
  }, [pathname, searchParams]);
  return null;
}
