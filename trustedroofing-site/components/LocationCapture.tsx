"use client";

import { useEffect, useState } from "react";

type Props = {
  onLocation: (coords: { lat: number; lng: number }) => void;
};

export default function LocationCapture({ onLocation }: Props) {
  const [status, setStatus] = useState("Requesting location...");
  const [postal, setPostal] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("Location services unavailable.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setStatus("Location captured.");
      },
      () => {
        setStatus("Location permission denied.");
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  }, [onLocation]);

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!postal) return;
    // TODO: integrate geocoding for postal lookups.
    setStatus("Thanks! We will use your postal code for nearby projects.");
  };

  return (
    <div className="hero-card">
      <h2>See completed projects near you</h2>
      <p style={{ color: "var(--color-muted)", marginTop: 8 }}>{status}</p>
      <form onSubmit={handleManualSubmit} style={{ marginTop: 16 }}>
        <label htmlFor="postal">Enter postal code</label>
        <input
          id="postal"
          className="input"
          value={postal}
          onChange={(event) => setPostal(event.target.value)}
          placeholder="T2P 1G1"
        />
        <button className="button" style={{ marginTop: 12 }} type="submit">
          Find nearby projects
        </button>
      </form>
    </div>
  );
}
