// useMapSearch.ts
// State for the map search bar: debounced suggestions, recent searches and
// picking a result. One session token is used per search (Google bills the
// autocomplete calls and the final details call as one session).

import { useCallback, useEffect, useState } from "react";

import {
  autocomplete,
  createSessionToken,
  placeDetails,
} from "@/services/places";
import { GoogleApiError } from "@/services/googleApi";
import type { Coordinates, PlaceDetails, PlaceSuggestion } from "@/types";

import { loadRecents, saveRecent } from "./recentSearches";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export type SearchStatus = "idle" | "loading" | "ready" | "empty" | "error";

function messageFor(err: unknown): string {
  if (err instanceof GoogleApiError) {
    if (err.kind === "no_key") return err.message;
    if (err.kind === "network") return "No connection. Check your internet and try again.";
  }
  return "Search isn't working right now. Please try again.";
}

export function useMapSearch(bias: Coordinates) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [rawStatus, setRawStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [recents, setRecents] = useState<PlaceSuggestion[]>([]);
  const [session, setSession] = useState(createSessionToken);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    loadRecents().then(setRecents);
  }, []);

  const { latitude, longitude } = bias;
  const active = query.trim().length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setRawStatus("loading");
      autocomplete(query, {
        sessionToken: session,
        bias: { latitude, longitude },
        signal: controller.signal,
      })
        .then((items) => {
          setResults(items);
          setError(null);
          setRawStatus(items.length === 0 ? "empty" : "ready");
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setError(messageFor(err));
          setRawStatus("error");
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, active, session, latitude, longitude]);

  // Pick a suggestion or a recent search. Returns the place, or null on failure.
  const choose = useCallback(
    async (item: PlaceSuggestion): Promise<PlaceDetails | null> => {
      setPicking(true);
      try {
        const details = await placeDetails(item.placeId, session);
        setSession(createSessionToken()); // the session ends with the details call
        saveRecent(item).then(setRecents);
        setQuery("");
        setResults([]);
        setRawStatus("idle");
        setError(null);
        return details;
      } catch (err) {
        setError(messageFor(err));
        setRawStatus("error");
        return null;
      } finally {
        setPicking(false);
      }
    },
    [session],
  );

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setRawStatus("idle");
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    suggestions: active ? results : [],
    status: picking ? "loading" : active ? rawStatus : "idle",
    error: active || rawStatus === "error" ? error : null,
    recents,
    choose,
    clear,
  };
}

export type MapSearch = ReturnType<typeof useMapSearch>;
