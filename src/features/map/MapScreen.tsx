import * as Location from "expo-location";
import { AppleMaps, GoogleMaps, useLocationPermissions } from "expo-maps";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { isFresh, lastSeenLabel } from "@/features/groups/lastSeen";
import { useGroup } from "@/hooks/use-group";
import { useMyProfile } from "@/hooks/use-my-profile";
import { useNow } from "@/hooks/use-now";

import { buildHeatmapCircles } from "./Heatmap";
import { getSuburbHeatmapPoints } from "./suburbHeatmapPoints";
import { getCapeTownCrimeHeatmapPoints } from "./crimeRiskScore";
import type { FilterKey, Filters } from "./FilterChips";
import {
  DEFAULT_USER_LOCATION,
  distanceKm,
  loadStations,
  nearestStation,
  stationLocation,
  zoomForDistance,
  type LatLng,
} from "./mapRisk";
import { ROUTE_COLOR, STATION_COLOR } from "./mapTheme";
import { MapOverlay } from "./MapOverlay";
import { useActiveAlert } from "./useActiveAlert";

// Starting view is central Cape Town. The camera moves to the user once their location is known.
const cameraPosition = {
  coordinates: { latitude: -33.9249, longitude: 18.4241 },
  zoom: 12,
};

export default function MapScreen() {
  const [permission] = useLocationPermissions({ request: true });
  const showUserLocation = permission?.granted ?? false;
  // Built once from the bundled SAPS crime data.
  const crimeHeatmapCircles = useMemo(
    () => buildHeatmapCircles(getSuburbHeatmapPoints()),

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

  const stations = useMemo(() => loadStations(), []);
  const alert = useActiveAlert();

  const [userPos, setUserPos] = useState<LatLng | null>(null);
  // selectedId: the tapped station (opens its info sheet).
  // helpActive: whether the route to the nearest station is showing.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [helpActive, setHelpActive] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    police: true,
    zones: true,
    alerts: true,
  });

  const googleMapRef = useRef<GoogleMaps.MapView>(null);
  const appleMapRef = useRef<AppleMaps.MapView>(null);

  const moveCamera = useCallback((coordinates: LatLng, zoom: number) => {
    const camera = { coordinates, zoom };
    googleMapRef.current?.setCameraPosition(camera);
    appleMapRef.current?.setCameraPosition(camera);
  }, []);

  useEffect(() => {
    if (!showUserLocation) return;

    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then(({ coords }) => {
        const here = { latitude: coords.latitude, longitude: coords.longitude };
        setUserPos(here);
        moveCamera(here, 15);
      })
      .catch(() => {});
  }, [showUserLocation, moveCamera]);

  const selected = stations.find((s) => s.station === selectedId) ?? null;
  const origin = userPos ?? DEFAULT_USER_LOCATION;
  const nearest = useMemo(
    () => nearestStation(stations, origin),
    [stations, origin],
  );

  const toggleFilter = (key: FilterKey) =>
    setFilters((current) => ({ ...current, [key]: !current[key] }));

  const handleNearestHelp = () => {
    if (helpActive) {
      setHelpActive(false);
      return;
    }
    setHelpActive(true);
    setSelectedId(null);
    const target = stationLocation(nearest);
    const km = distanceKm(origin, target);
    moveCamera(
      {
        latitude: (origin.latitude + target.latitude) / 2,
        longitude: (origin.longitude + target.longitude) / 2,
      },
      zoomForDistance(km),
    );
  };

  const handleLocate = () => moveCamera(origin, 15);

  const handleMarkerClick = (event: { id?: string }) => {
    if (!event.id) return;
    setSelectedId(event.id);
    setHelpActive(false);
  };

  const polylines = helpActive
    ? [
        {
          id: "nearest-help",
          coordinates: [origin, stationLocation(nearest)],
          color: ROUTE_COLOR,
          width: 6,
        },
      ]
    : [];

  const circles = filters.zones ? crimeHeatmapCircles : [];

  const overlay = (
    <MapOverlay
      alert={alert}
      filters={filters}
      onToggleFilter={toggleFilter}
      selected={selected}
      onCloseSheet={() => setSelectedId(null)}
      helpActive={helpActive}
      onNearestHelp={handleNearestHelp}
      onLocate={handleLocate}
    />
  );

  if (Platform.OS === "ios") {
    const stationMarkers = filters.police
      ? stations.map((s) => ({
          id: s.station,
          coordinates: stationLocation(s),
          title: s.name,
          systemImage: "shield.fill",
          tintColor: STATION_COLOR,
        }))
      : [];

    return (
      <View style={styles.map}>
        <AppleMaps.View
          ref={appleMapRef}
          style={styles.map}
          cameraPosition={cameraPosition}
          properties={{ isMyLocationEnabled: showUserLocation }}
          uiSettings={{ myLocationButtonEnabled: false }}
          circles={circles}
          markers={[...stationMarkers, ...memberMarkers]}
          polylines={polylines}
          onMarkerClick={handleMarkerClick}
        />
        {overlay}
      </View>
    );
  }
  if (Platform.OS === "android") {
    const stationMarkers = filters.police
      ? stations.map((s) => ({
          id: s.station,
          coordinates: stationLocation(s),
          title: s.name,
          showCallout: false,
        }))
      : [];

    return (
      <View style={styles.map}>
        <GoogleMaps.View
          ref={googleMapRef}
          style={styles.map}
          cameraPosition={cameraPosition}
          properties={{ isMyLocationEnabled: showUserLocation }}
          uiSettings={{ myLocationButtonEnabled: false }}
          circles={circles}
          markers={[...stationMarkers, ...memberMarkers]}
          polylines={polylines}
          onMarkerClick={handleMarkerClick}
        />
        {overlay}
      </View>
    );
  }
  return <Text>Maps are not available on web.</Text>;
}

const styles = StyleSheet.create({ map: { flex: 1 } });
