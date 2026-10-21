// places.ts
// Google Places API (New): autocomplete suggestions and place details.
// One session token covers a whole search (several autocomplete calls and the
// final details call), which Google bills as a single session.

import type { Coordinates, PlaceDetails, PlaceSuggestion } from "@/types";

import { googleFetch, googleHeaders } from "./googleApi";

const BASE = "https://places.googleapis.com/v1";
const BIAS_RADIUS_METERS = 50_000; // the maximum Google allows for a circle
const MIN_QUERY_LENGTH = 2;

export function createSessionToken(): string {
  // UUID v4 shaped. Not used for security, only to group billing.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

type AutocompleteResponse = {
  suggestions?: {
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }[];
};

export function parseAutocomplete(json: unknown): PlaceSuggestion[] {
  const data = json as AutocompleteResponse;
  const out: PlaceSuggestion[] = [];
  for (const item of data?.suggestions ?? []) {
    const p = item.placePrediction;
    if (!p?.placeId) continue;
    const primary = p.structuredFormat?.mainText?.text ?? p.text?.text ?? "";
    if (!primary) continue;
    out.push({
      placeId: p.placeId,
      primaryText: primary,
      secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
    });
  }
  return out;
}

type DetailsResponse = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
};

export function parseDetails(json: unknown): PlaceDetails | null {
  const d = json as DetailsResponse;
  const lat = d?.location?.latitude;
  const lng = d?.location?.longitude;
  if (!d?.id || typeof lat !== "number" || typeof lng !== "number") return null;
  return {
    placeId: d.id,
    name: d.displayName?.text ?? d.formattedAddress ?? "Selected place",
    address: d.formattedAddress ?? "",
    coordinates: { latitude: lat, longitude: lng },
  };
}

export async function autocomplete(
  input: string,
  options: { sessionToken: string; bias: Coordinates; signal?: AbortSignal },
): Promise<PlaceSuggestion[]> {
  const text = input.trim();
  if (text.length < MIN_QUERY_LENGTH) return [];

  const json = await googleFetch(
    `${BASE}/places:autocomplete`,
    {
      method: "POST",
      headers: googleHeaders(),
      body: JSON.stringify({
        input: text,
        sessionToken: options.sessionToken,
        includedRegionCodes: ["za"],
        locationBias: {
          circle: { center: options.bias, radius: BIAS_RADIUS_METERS },
        },
      }),
    },
    options.signal,
  );
  return parseAutocomplete(json);
}

export async function placeDetails(
  placeId: string,
  sessionToken: string,
): Promise<PlaceDetails> {
  const json = await googleFetch(
    `${BASE}/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`,
    {
      method: "GET",
      headers: googleHeaders("id,displayName,formattedAddress,location"),
    },
  );
  const details = parseDetails(json);
  if (!details) throw new Error("That place has no location.");
  return details;
}
