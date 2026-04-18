import type { Metadata } from "next";
import SolarDebugClient from "./solar-debug-client";
import "./solar-debug.css";

export const metadata: Metadata = {
  title: "Solar API Inspector",
  description: "Private tooling page for inspecting Google Solar API responses.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-image-preview": "none",
      "max-snippet": 0,
      "max-video-preview": 0
    }
  }
};

export default function SolarInspectorPage() {
  return (
    <section className="section">
      <div className="hero solar-debug-hero">
        <div className="hero-card solar-debug-intro">
          <span className="badge">Private / noindex utility</span>
          <h1 className="hero-title">Solar API Inspector</h1>
          <p className="hero-subtitle">
            Enter an address to geocode it, call Google Solar API endpoints, and inspect
            dataLayers/buildingInsights responses with field-level explanations.
          </p>
        </div>
      </div>

      <div className="solar-debug-wrapper">
        <SolarDebugClient />
      </div>
    </section>
  );
}
