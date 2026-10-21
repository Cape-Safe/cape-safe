// googleApi.ts
// Shared plumbing for the Google Places (New) and Routes REST calls.
// The key is read from EXPO_PUBLIC_GOOGLE_PLACES_API_KEY (see README). It is
// bundled into the app, so restrict it in Google Cloud (APIs, app package and
// SHA-1) and keep a billing budget alert on.

import Constants from "expo-constants";
import { Platform } from "react-native";

export type ApiErrorKind = "no_key" | "network" | "api";

export class GoogleApiError extends Error {
  kind: ApiErrorKind;
  constructor(kind: ApiErrorKind, message: string) {
    super(message);
    this.name = "GoogleApiError";
    this.kind = kind;
  }
}

const TIMEOUT_MS = 10_000;

export function googleHeaders(fieldMask?: string): Record<string, string> {
  const key = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new GoogleApiError("no_key", "Search isn't set up on this build.");
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": key,
  };
  if (fieldMask) headers["X-Goog-FieldMask"] = fieldMask;

  // Lets an app-restricted key work for REST calls on Android.
  if (Platform.OS === "android") {
    const pkg = Constants.expoConfig?.android?.package;
    const sha1 = process.env.EXPO_PUBLIC_ANDROID_CERT_SHA1;
    if (pkg && sha1) {
      headers["X-Android-Package"] = pkg;
      headers["X-Android-Cert"] = sha1;
    }
  }
  return headers;
}

/** fetch with a timeout. Never includes the key or response body in errors. */
export async function googleFetch(
  url: string,
  init: RequestInit,
  signal?: AbortSignal,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  signal?.addEventListener("abort", () => controller.abort());
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new GoogleApiError("api", `Google returned ${response.status}.`);
    }
    return await response.json();
  } catch (err) {
    if (err instanceof GoogleApiError) throw err;
    if (signal?.aborted) throw err; // caller cancelled on purpose
    throw new GoogleApiError("network", "Couldn't reach the search service.");
  } finally {
    clearTimeout(timer);
  }
}
