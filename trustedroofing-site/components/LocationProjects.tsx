"use client";

import { useState } from "react";
import LocationCapture from "./LocationCapture";
import ProjectCarousel from "./ProjectCarousel";

export default function LocationProjects() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <>
      <LocationCapture onLocation={setCoords} />
      <ProjectCarousel
        nearLat={coords?.lat ?? null}
        nearLng={coords?.lng ?? null}
        fallbackLabel="Recent projects in Calgary"
        limit={5}
      />
    </>
  );
}
