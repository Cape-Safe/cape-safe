// directions.ts
// Google Routes API: a road route between two points for driving or walking.

import {
  decodePolyline,
  parseDuration,
} from "@/features/map/routeUtils";
import type { Coordinates, RouteSummary, TravelMode } from "@/types";

import { googleFetch, googleHeaders } from "./googleApi";

const URL = "https://routes.googleapis.com/directions/v2:computeRoutes";
const FIELD_MASK =
  "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline";

type RoutesResponse = {
  routes?: {
    distanceMeters?: number;
    duration?: string;
    polyline?: { encodedPolyline?: string };
  }[];
};

export function parseRoute(json: unknown, mode: TravelMode): RouteSummary {
  const route = (json as RoutesResponse)?.routes?.[0];
  const encoded = route?.polyline?.encodedPolyline;
  if (!route || !encoded) throw new Error("No route found.");
  return {
    mode,
    distanceMeters: route.distanceMeters ?? 0,
    durationSeconds: parseDuration(route.duration),
    points: decodePolyline(encoded),
    estimated: false,
  };
}

const latLng = (c: Coordinates) => ({ location: { latLng: c } });

export async function fetchRoute(
  origin: Coordinates,
  destination: Coordinates,
  mode: TravelMode,
): Promise<RouteSummary> {
  const json = await googleFetch(URL, {
    method: "POST",
    headers: googleHeaders(FIELD_MASK),
    body: JSON.stringify({
      origin: latLng(origin),
      destination: latLng(destination),
      travelMode: mode === "walk" ? "WALK" : "DRIVE",
      polylineEncoding: "ENCODED_POLYLINE",
    }),
  });
  return parseRoute(json, mode);
}
