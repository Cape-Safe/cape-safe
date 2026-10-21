// routeUtils.ts
// Pure helpers for directions: polyline decoding, formatting and the links
// that open the phone's own maps app. No network or React in here.

import type { Coordinates, RouteSummary, TravelMode } from "@/types";

import { distanceKm } from "./mapRisk";

/** Decodes a Google encoded polyline (precision 5) into coordinates. */
export function decodePolyline(encoded: string): Coordinates[] {
  const points: Coordinates[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

/** The Routes API sends durations as strings like "845s". */
export function parseDuration(value: string | undefined): number {
  if (!value) return 0;
  const seconds = parseFloat(value.replace("s", ""));
  return Number.isFinite(seconds) ? Math.round(seconds) : 0;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

const FALLBACK_SPEED_KMH: Record<TravelMode, number> = { walk: 5, drive: 30 };

/** A straight line between two points, used when the Routes call fails. */
export function straightLineRoute(
  origin: Coordinates,
  destination: Coordinates,
  mode: TravelMode,
): RouteSummary {
  const km = distanceKm(origin, destination);
  return {
    mode,
    distanceMeters: Math.round(km * 1000),
    durationSeconds: Math.round((km / FALLBACK_SPEED_KMH[mode]) * 3600),
    points: [origin, destination],
    estimated: true,
  };
}

/** Link that opens Apple Maps (iOS) or Google Maps (everything else). */
export function externalDirectionsUrl(
  destination: Coordinates,
  mode: TravelMode,
  os: string,
): string {
  const { latitude, longitude } = destination;
  if (os === "ios") {
    return `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=${mode === "walk" ? "w" : "d"}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=${mode === "walk" ? "walking" : "driving"}`;
}
