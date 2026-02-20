"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type RecentQuote = {
  id: string;
  area: string;
  service: string;
  range: string;
  completed: string;
};

type LocationStatus =
  | "idle"
  | "locating"
  | "granted"
  | "ip_fallback"
  | "defaulted";

const recentQuotes: RecentQuote[] = [
  {
    id: "q-1001",
    area: "Mahogany",
    service: "Roof",
    range: "$11.8k - $15.4k",
    completed: "2 hours ago"
  },
  {
    id: "q-1002",
    area: "Seton",
    service: "All exterior scopes",
    range: "$18.2k - $27.9k",
    completed: "4 hours ago"
  },
  {
    id: "q-1003",
    area: "Auburn Bay",
    service: "Eavestrough",
    range: "$2.4k - $3.5k",
    completed: "today"
  },
  {
    id: "q-1004",
    area: "Brentwood",
    service: "Vinyl siding",
    range: "$10.7k - $14.1k",
    completed: "today"
  },
  {
    id: "q-1005",
    area: "Signal Hill",
    service: "Hardie siding",
    range: "$15.3k - $21.9k",
    completed: "yesterday"
  },
  {
    id: "q-1006",
    area: "Evanston",
    service: "Roof",
    range: "$9.9k - $13.2k",
    completed: "yesterday"
  }
];

async function getIpCityFallback(): Promise<string | null> {
  try {
    const response = await fetch("https://ipapi.co/json/", {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { city?: string };
    return data.city?.trim() || null;
  } catch {
    return null;
  }
}

export default function NearbyQuotesCarousel() {
  const [cursor, setCursor] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [locationText, setLocationText] = useState("Calgary");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCursor((prev) => (prev + 1) % recentQuotes.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateVisibleCount = () => {
      setVisibleCount(window.innerWidth <= 860 ? 2 : 3);
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);

    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const visibleQuotes = useMemo(() => {
    return Array.from({ length: visibleCount }).map((_, offset) => {
      const index = (cursor + offset) % recentQuotes.length;
      return recentQuotes[index];
    });
  }, [cursor, visibleCount]);

  const captureLocation = useCallback(async () => {
    setStatus("locating");

    const streetLevelLocated = await new Promise<boolean>((resolve) => {
      if (!("geolocation" in navigator)) {
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });

    if (streetLevelLocated) {
      setStatus("granted");
      setLocationText("near you");
      return;
    }

    const city = await getIpCityFallback();

    if (city) {
      setStatus("ip_fallback");
      setLocationText(city);
      return;
    }

    setStatus("defaulted");
    setLocationText("Calgary");
  }, []);

  useEffect(() => {
    void captureLocation();
  }, [captureLocation]);

  return (
    <section className="nearby-quotes">
      <div className="nearby-quotes__head">
        <div>
          <p className="nearby-quotes__kicker">Geo-view</p>
          <h2>Recent quotes {locationText}</h2>
        </div>
        <button className="nearby-quotes__location" type="button" onClick={() => void captureLocation()}>
          {status === "locating" ? "Locating..." : "My location"}
        </button>
      </div>

      <div className="nearby-quotes__carousel" aria-live="polite">
        {visibleQuotes.map((quote) => (
          <article key={quote.id} className="nearby-quotes__card">
            <p className="nearby-quotes__area">{quote.area}</p>
            <p>{quote.service}</p>
            <p className="nearby-quotes__range">{quote.range}</p>
            <p className="nearby-quotes__time">{quote.completed}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
