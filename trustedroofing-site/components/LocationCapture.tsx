"use client";

import { useEffect, useState } from "react";
import { getBrowserLocation } from "@/lib/geo";

type Props = {
  onLocation: (coords: { lat: number; lng: number } | null) => void;
};

export default function LocationCapture({ onLocation }: Props) {
  const [status, setStatus] = useState("Recent projects in Calgary");

  useEffect(() => {
    let mounted = true;

    getBrowserLocation()
      .then((coords) => {
        if (!mounted) return;
        onLocation(coords);
        setStatus("Showing projects near you.");
      })
      .catch(() => {
        if (!mounted) return;
        onLocation(null);
        setStatus("Location permission declined. Showing Calgary feed.");
      });

    return () => {
      mounted = false;
    };
  }, [onLocation]);

  return <p style={{ color: "var(--color-muted)", marginBottom: 12 }}>{status}</p>;
}
