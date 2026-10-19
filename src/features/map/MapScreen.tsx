import * as Location from "expo-location";
import {
  AppleMaps,
  GoogleMaps,
  useLocationPermissions,
  type CameraMoveEvent,
} from "expo-maps";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { buildHeatmapCircles } from "./Heatmap";
import RiskGauge from "./RiskGauge";
import {
  getAreaRiskAt,
  getCapeTownCrimeHeatmapPoints,
  type AreaRisk,
} from "./crimeRiskScore";

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

  const [area, setArea] = useState<AreaRisk>(() =>
    getAreaRiskAt(
      cameraPosition.coordinates.latitude,
      cameraPosition.coordinates.longitude,
    ),
  );
  const onCameraMove = useCallback(({ coordinates }: CameraMoveEvent) => {
    const { latitude, longitude } = coordinates;
    if (latitude == null || longitude == null) return;
    const next = getAreaRiskAt(latitude, longitude);
    // fires continuously while panning; only re-render on a new suburb
    setArea((prev) => (prev.suburb === next.suburb ? prev : next));
  }, []);

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
      <View style={styles.map}>
        <AppleMaps.View
          ref={appleMapRef}
          style={styles.map}
          cameraPosition={cameraPosition}
          properties={{ isMyLocationEnabled: showUserLocation }}
          circles={crimeHeatmapCircles}
          onCameraMove={onCameraMove}
        />
        <RiskGauge area={area} />
      </View>
    );
  }
  if (Platform.OS === "android") {
    return (
      <View style={styles.map}>
        <GoogleMaps.View
          ref={googleMapRef}
          style={styles.map}
          cameraPosition={cameraPosition}
          properties={{ isMyLocationEnabled: showUserLocation }}
          circles={crimeHeatmapCircles}
          onCameraMove={onCameraMove}
        />
        <RiskGauge area={area} />
      </View>
    );
  }
  return <Text>Maps are not available on web.</Text>;
}

const styles = StyleSheet.create({ map: { flex: 1 } });
