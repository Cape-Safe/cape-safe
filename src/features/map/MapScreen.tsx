import * as Location from "expo-location";
import { Platform, StyleSheet, Text, View } from "react-native";

const AppleMaps = Platform.OS === "ios" ? require("expo-maps").AppleMaps : null;
const GoogleMaps = Platform.OS === "android" ? require("expo-maps").GoogleMaps : null;

export default function MapScreen() {
  const location = Location.useLastKnownLocation();

  if (Platform.OS === "web" || (!AppleMaps && !GoogleMaps)) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          O mapa interativo está disponível apenas no aplicativo móvel.
        </Text>
      </View>
    );
  }

  const MapView = Platform.OS === "ios" ? AppleMaps.View : GoogleMaps.View;

  return (
    <View style={styles.container}>
      <MapView style={styles.map} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  fallbackText: {
    textAlign: "center",
    fontSize: 16,
  },
});