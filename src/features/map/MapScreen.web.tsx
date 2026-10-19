import { useMemo } from "react";
import { buildHeatmapCircles, type HeatmapCircle } from "./Heatmap";
import { getCapeTownCrimeHeatmapPoints } from "./crimeRiskScore";

// expo-maps has no web support, so web draws the heatmap with Leaflet.

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

  return (
    <iframe
      title="Cape Town crime-risk map"
      srcDoc={html}
      allow="geolocation"
      style={{ border: 0, width: "100%", height: "100%", flex: 1 }}
    />
  );
}
