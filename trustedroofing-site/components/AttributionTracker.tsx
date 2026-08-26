"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { appendJourney, ATTRIBUTION_STORAGE_KEY, ensureBrowserAttribution, safePath, type AttributionSnapshot, type JourneyEventName } from "@/lib/attribution";

declare global { interface Window { trustedAttribution?: { snapshot: () => AttributionSnapshot | null; track: (event: JourneyEventName, label?: string) => void } } }

export default function AttributionTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const initial = ensureBrowserAttribution();
      if (!initial) throw new Error("Browser storage unavailable");
      let snapshot: AttributionSnapshot = initial;
      const classifyPath = (path: string): JourneyEventName | null => path.startsWith("/services/") ? "service_page_viewed" : path.startsWith("/projects/") ? "project_page_viewed" : path.startsWith("/service-areas/") ? "service_area_page_viewed" : null;
      const persist = () => localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(snapshot));
      const track = (event: JourneyEventName, label?: string) => { snapshot = { ...snapshot, journey: appendJourney(snapshot.journey || [], { event, path: safePath(location.href), at: new Date().toISOString(), label }) }; persist(); };
      if (!snapshot.journey.length || snapshot.journey.at(-1)?.at === snapshot.session_started_at) track("landing");
      const pageEvent = classifyPath(pathname); if (pageEvent) track(pageEvent);
      persist(); window.trustedAttribution = { snapshot: () => snapshot, track };
    } catch { window.trustedAttribution = { snapshot: () => null, track: () => undefined }; }
  }, [pathname]);
  return null;
}
