"use client";

import { useState } from "react";
import LocationCapture from "./LocationCapture";
import ProjectCarousel from "./ProjectCarousel";

export default function LocationProjects() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );

  return (
    <>
      <LocationCapture onLocation={setCoords} />
      <div style={{ marginTop: 32 }}>
        <ProjectCarousel
          nearLat={coords?.lat ?? null}
          nearLng={coords?.lng ?? null}
          fallbackLabel="Recent projects in Calgary"
        />
      </div>
    </>
  );
}
