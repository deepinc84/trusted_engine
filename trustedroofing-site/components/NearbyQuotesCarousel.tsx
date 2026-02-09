"use client";

import { useEffect, useMemo, useState } from "react";

type RecentQuote = {
  id: string;
  area: string;
  service: string;
  range: string;
  completed: string;
};

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

export default function NearbyQuotesCarousel() {
  const [cursor, setCursor] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [status, setStatus] = useState<"idle" | "locating" | "granted" | "denied">(
    "idle"
  );
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

  const captureLocation = () => {
    if (!("geolocation" in navigator)) {
      setStatus("denied");
      return;
    }

    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      () => {
        setStatus("granted");
        setLocationText("near you");
      },
      () => {
        setStatus("denied");
        setLocationText("Calgary");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  return (
    <section className="nearby-quotes">
      <div className="nearby-quotes__head">
        <div>
          <p className="nearby-quotes__kicker">Geo-view</p>
          <h2>Recent quotes {locationText}</h2>
        </div>
        <button className="nearby-quotes__location" type="button" onClick={captureLocation}>
          {status === "locating" ? "Locating..." : "Use my location"}
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
