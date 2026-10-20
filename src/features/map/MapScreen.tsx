import * as Location from "expo-location";
import { AppleMaps, GoogleMaps, useLocationPermissions } from "expo-maps";
import { useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, Text } from "react-native";

import { isFresh, lastSeenLabel } from "@/features/groups/lastSeen";
import { useGroup } from "@/hooks/use-group";
import { useMyProfile } from "@/hooks/use-my-profile";
import { useNow } from "@/hooks/use-now";

import { buildHeatmapCircles } from "./Heatmap";
import { getCapeTownCrimeHeatmapPoints } from "./crimeRiskScore";

const cameraPosition = {
  coordinates: { latitude: -33.9249, longitude: 18.4241 },
  zoom: 12,
};

export default function MapScreen() {
  const [permission] = useLocationPermissions({ request: true });
  const showUserLocation = permission?.granted ?? false;
  const crimeHeatmapCircles = useMemo(
    () => buildHeatmapCircles(getCapeTownCrimeHeatmapPoints()),
    [],
  );

  // Group members who are sharing (not you, not stale).
  const { uid, groupCode } = useMyProfile();
  const { locations } = useGroup(groupCode);
  const now = useNow(30_000);
  const memberMarkers = locations
    .filter((l) => l.uid !== uid && isFresh(l, now))
    .map((l) => ({
      id: l.uid,
      coordinates: l.coordinates,
      title: l.displayName,
      snippet: `Last seen ${lastSeenLabel(l, now)}`,
    }));

  const googleMapRef = useRef<GoogleMaps.MapView>(null);
  const appleMapRef = useRef<AppleMaps.MapView>(null);

  useEffect(() => {
    if (!showUserLocation) return;

    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then(({ coords }) => {
        const camera = {
          coordinates: {
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
          zoom: 15,
        };
        googleMapRef.current?.setCameraPosition(camera);
        appleMapRef.current?.setCameraPosition(camera);
      })
      .catch(() => {});
  }, [showUserLocation]);

  if (Platform.OS === "ios") {
    return (
      <AppleMaps.View
        ref={appleMapRef}
        style={styles.map}
        cameraPosition={cameraPosition}
        properties={{ isMyLocationEnabled: showUserLocation }}
        circles={crimeHeatmapCircles}
        markers={memberMarkers}
      />
    );
  }
  if (Platform.OS === "android") {
    return (
      <GoogleMaps.View
        ref={googleMapRef}
        style={styles.map}
        cameraPosition={cameraPosition}
        properties={{ isMyLocationEnabled: showUserLocation }}
        circles={crimeHeatmapCircles}
        markers={memberMarkers}
      />
    );
  }
  return <Text>Maps are not available on web.</Text>;
}

const styles = StyleSheet.create({ map: { flex: 1 } });
