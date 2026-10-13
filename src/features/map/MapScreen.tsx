import * as Location from "expo-location";
import { AppleMaps, GoogleMaps, useLocationPermissions } from "expo-maps";
import { useEffect, useRef } from "react";
import { Platform, StyleSheet, Text } from "react-native";

const cameraPosition = {
  coordinates: { latitude: -33.9249, longitude: 18.4241 }, // Cape Town
  zoom: 12,
};

export default function MapScreen() {
  const [permission] = useLocationPermissions({ request: true });
  const showUserLocation = permission?.granted ?? false;

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
      />
    );
  }
  return <Text>Maps are not available on web.</Text>;
}

const styles = StyleSheet.create({ map: { flex: 1 } });
