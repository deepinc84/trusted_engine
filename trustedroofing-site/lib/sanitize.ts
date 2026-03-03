export function roundLatLng(
  lat: number | null,
  lng: number | null,
  precision = 3
): { lat: number | null; lng: number | null } {
  if (lat === null || lng === null) {
    return { lat: null, lng: null };
  }

  const factor = 10 ** precision;
  return {
    lat: Math.round(lat * factor) / factor,
    lng: Math.round(lng * factor) / factor
  };
}

export function sanitizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
