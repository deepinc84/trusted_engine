import { Project } from "./db";

const DEFAULT_PRECISION = 3;

export function roundLatLng(
  coords: { lat: number; lng: number },
  precision = DEFAULT_PRECISION
) {
  const factor = Math.pow(10, precision);
  return {
    lat: Math.round(coords.lat * factor) / factor,
    lng: Math.round(coords.lng * factor) / factor
  };
}

export function sanitizePublicProject(project: Project) {
  return {
    ...project,
    sanitized_geo: roundLatLng(project.sanitized_geo)
  };
}

export function stripPII<T extends Record<string, unknown>>(payload: T) {
  const sanitized = { ...payload };
  delete sanitized.address;
  delete sanitized.name;
  delete sanitized.phone;
  delete sanitized.email;
  return sanitized;
}
