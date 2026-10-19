import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { buildHeatmapCircles, type HeatmapCircle } from "./Heatmap";
import RiskGauge from "./RiskGauge";
import { getAreaRiskAt, getCapeTownCrimeHeatmapPoints } from "./crimeRiskScore";

// expo-maps has no web support, so web draws the heatmap with Leaflet.

const CENTER_MESSAGE = "capesafe:map-center";

const cameraPosition = {
  coordinates: { latitude: -33.9249, longitude: 18.4241 },
  zoom: 12,
};

function buildLeafletHtml(circles: HeatmapCircle[]) {
  const { latitude, longitude } = cameraPosition.coordinates;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html, body, #map { height: 100%; margin: 0; }</style>
</head>
<body>
<div id="map"></div>
<script>
  const map = L.map("map", { zoomControl: false }).setView([${latitude}, ${longitude}], ${cameraPosition.zoom});
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  const circles = ${JSON.stringify(circles)};
  const heatmap = L.featureGroup(
    circles.map((c) =>
      L.circle([c.center.latitude, c.center.longitude], {
        radius: c.radius,
        stroke: false,
        fillColor: c.color,
        fillOpacity: 1,
      }),
    ),
  ).addTo(map);
  if (circles.length > 0) map.fitBounds(heatmap.getBounds(), { padding: [24, 24] });

  const postCenter = () => {
    const c = map.getCenter();
    parent.postMessage({ type: "${CENTER_MESSAGE}", latitude: c.lat, longitude: c.lng }, "*");
  };
  map.on("moveend", postCenter);
  postCenter();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const here = [coords.latitude, coords.longitude];
      L.circleMarker(here, { radius: 7, color: "#fff", weight: 2, fillColor: "#208AEF", fillOpacity: 1 }).addTo(map);
    }, () => {});
  }
</script>
</body>
</html>`;
}

export default function MapScreen() {
  const html = useMemo(
    () => buildLeafletHtml(buildHeatmapCircles(getCapeTownCrimeHeatmapPoints())),
    [],
  );
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [area, setArea] = useState(() =>
    getAreaRiskAt(
      cameraPosition.coordinates.latitude,
      cameraPosition.coordinates.longitude,
    ),
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const { type, latitude, longitude } = event.data ?? {};
      if (type !== CENTER_MESSAGE) return;
      if (typeof latitude !== "number" || typeof longitude !== "number") return;
      setArea(getAreaRiskAt(latitude, longitude));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <View style={styles.container}>
      <iframe
        ref={frameRef}
        title="Cape Town crime-risk map"
        srcDoc={html}
        allow="geolocation"
        style={{ border: 0, width: "100%", height: "100%", flex: 1 }}
      />
      <RiskGauge area={area} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
