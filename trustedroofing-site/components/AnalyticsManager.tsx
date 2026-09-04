"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getConsent, setConsent, trackEvent, trackQuoteCTA } from "@/lib/analytics";
import { ensureBrowserAttribution, safePath } from "@/lib/attribution";

export default function AnalyticsManager() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [ads, setAds] = useState(false);

  useEffect(() => { setShowConsent(!getConsent()); }, []);
  useEffect(() => {
    const consentChanged = () => trackEvent("page_view", { page_path: safePath(location.href), page_title: document.title, previous_page_path: previousPath.current }, { dedupeKey: `consent-page:${pathname}` });
    window.addEventListener("trusted-consent-change", consentChanged);
    return () => window.removeEventListener("trusted-consent-change", consentChanged);
  }, [pathname]);
  useEffect(() => {
    const snapshot = ensureBrowserAttribution();
    trackEvent("page_view", { page_path: safePath(location.href), page_title: document.title, previous_page_path: previousPath.current, landing_page: snapshot?.last_touch.landing_path, timestamp: new Date().toISOString() }, { dedupeKey: `page:${pathname}` });
    previousPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const click = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const locationName = link.dataset.analyticsLocation || (link.closest("header") ? "header" : link.closest("footer") ? "footer" : "content");
      if (link.protocol === "tel:") trackEvent("click_call", { page_path: location.pathname, link_location: locationName });
      else if (link.protocol === "mailto:") trackEvent("click_email", { page_path: location.pathname, link_location: locationName });
      else if (link.dataset.quoteCta !== undefined || /quote|estimate/i.test(link.textContent || "")) trackQuoteCTA(locationName, link.href);
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);

  if (!showConsent) return null;
  return <aside className="consent-banner" aria-label="Privacy choices">
    <strong>Privacy choices</strong>
    <p>We use anonymous first-party journey analytics and Google Analytics only with your permission. Necessary site storage remains available.</p>
    <label><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} /> Analytics</label>
    <label><input type="checkbox" checked={ads} onChange={e => setAds(e.target.checked)} /> Advertising measurement</label>
    <div><button className="button" onClick={() => { setConsent(analytics, ads); setShowConsent(false); }}>Save choices</button><button className="button button--ghost" onClick={() => { setConsent(false, false); setShowConsent(false); }}>Decline optional</button></div>
  </aside>;
}
