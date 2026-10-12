import { AppleMaps, GoogleMaps } from "expo-maps";
import { Platform, StyleSheet, Text } from "react-native";

const cameraPosition = {
  coordinates: { latitude: -33.9249, longitude: 18.4241 }, // Cape Town; change as needed
  zoom: 12,
};

export default function MapScreen() {
  if (Platform.OS === "ios") {
    return (
      <AppleMaps.View style={styles.map} cameraPosition={cameraPosition} />
    );
  }
  if (Platform.OS === "android") {
    return (
      <GoogleMaps.View style={styles.map} cameraPosition={cameraPosition} />
    );
  }
  return <Text>Maps are not available on web.</Text>;
}

const styles = StyleSheet.create({ map: { flex: 1 } });
