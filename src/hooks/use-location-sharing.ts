import * as Location from "expo-location";
import { useEffect } from "react";

import { shareMyLocation, stopSharingLocation } from "@/services/groups";

const SEND_EVERY_MS = 30_000;

/**
 * While `enabled` and the app is open, sends this device's location to the
 * group about every 30 s. Turning it off (or leaving) removes the location.
 */
export function useLocationSharing(
  groupCode: string | undefined,
  enabled: boolean,
  displayName: string,
) {
  useEffect(() => {
    if (!groupCode || !enabled) return;

    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;
    let lastSent = 0;

    (async () => {
      const { granted } = await Location.getForegroundPermissionsAsync();
      if (!granted || cancelled) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: SEND_EVERY_MS,
          distanceInterval: 0,
        },
        ({ coords }) => {
          const now = Date.now();
          if (now - lastSent < SEND_EVERY_MS) return; // iOS ignores timeInterval
          lastSent = now;
          shareMyLocation(
            groupCode,
            { latitude: coords.latitude, longitude: coords.longitude },
            coords.accuracy ?? 0,
            displayName,
          ).catch((err) => console.warn("Sharing location failed:", err));
        },
      );
      if (cancelled) subscription.remove();
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
      stopSharingLocation(groupCode).catch(() => {});
    };
  }, [groupCode, enabled, displayName]);
}
