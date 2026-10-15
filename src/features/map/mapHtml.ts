import { INCIDENTS, SEVERITY_COLOR } from "@/data/mock";

const RADIUS = { high: 400, medium: 250, low: 150 } as const;

export function buildHtml(dark: boolean) {
  const data = {
    incidents: INCIDENTS.map((i) => ({
      id: i.id, lat: i.coordinates.latitude, lng: i.coordinates.longitude,
      color: SEVERITY_COLOR[i.severity], radius: RADIUS[i.severity],
    })),
  };
  const gray = dark ? "Canvas/World_Dark_Gray" : "Canvas/World_Light_Gray";
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<style>
html,body,#map{height:100%;margin:0;background:${dark ? "#111" : "#eee"}}
.leaflet-control-attribution{font-size:9px}
.poi{border-radius:50%;color:#fff;font:700 13px/22px system-ui,sans-serif;text-align:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)}
.poi.police{background:#0A84FF}.poi.hospital{background:#8E4EC6}.poi.dest{background:#FF9500}
</style>
</head><body><div id="map"></div>
<script>window.onerror=function(m){window.ReactNativeWebView.postMessage(JSON.stringify({error:"Map script error: "+String(m)}));};</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>if(typeof L==="undefined"){window.ReactNativeWebView.postMessage(JSON.stringify({error:"Map library did not load. Check the phone's internet connection."}));}</script>
<script>
var D = ${JSON.stringify(data)};
function post(o) { window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
function send(id) { post({ id: id }); }

var map = L.map('map', { zoomControl: false }).setView([-33.9249, 18.4241], 12);
var esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
var street = L.tileLayer(esri + 'World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
  maxNativeZoom: 19, maxZoom: 19,
  attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
}).addTo(map);
var grayBase = L.tileLayer(esri + '${gray}_Base/MapServer/tile/{z}/{y}/{x}', {
  maxNativeZoom: 16, maxZoom: 19, attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
});
var grayLabels = L.tileLayer(esri + '${gray}_Reference/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, maxZoom: 19 });
var tileErrors = 0;
[street, grayBase].forEach(function (layer) {
  layer.on('tileerror', function () { if (!tileErrors++) post({ error: 'Map tiles are not loading (network or tile server blocked).' }); });
  layer.on('load', function () { post({ loaded: true }); });
});
function setBase(isGray) {
  if (isGray) { map.removeLayer(street); grayBase.addTo(map); grayLabels.addTo(map); }
  else { map.removeLayer(grayBase); map.removeLayer(grayLabels); street.addTo(map); }
}

map.createPane('heat');
map.getPane('heat').style.zIndex = 350;
var heat = L.layerGroup();
function heatColor(w) { return 'hsl(' + Math.round(120 * (1 - w)) + ', 90%, 50%)'; }
function setHeat(points, on) {
  heat.clearLayers();
  setBase(on);
  if (!on) { map.removeLayer(heat); return; }
  points.forEach(function (p) {
    for (var k = 1; k <= 6; k++) {
      L.circle([p.lat, p.lng], { pane: 'heat', radius: p.r * k / 6, stroke: false, fillColor: heatColor(p.w), fillOpacity: 0.05 + 0.1 * p.w, interactive: false }).addTo(heat);
    }
  });
  map.addLayer(heat);
}

var incidents = L.layerGroup().addTo(map);
D.incidents.forEach(function (i) {
  L.circle([i.lat, i.lng], { radius: i.radius, color: i.color, weight: 1, fillColor: i.color, fillOpacity: 0.25, interactive: false }).addTo(incidents);
  L.circleMarker([i.lat, i.lng], { radius: 10, color: '#fff', weight: 2, fillColor: i.color, fillOpacity: 1, bubblingMouseEvents: false })
    .on('click', function () { send(i.id); }).addTo(incidents);
});
function setIncidents(on) { if (on) map.addLayer(incidents); else map.removeLayer(incidents); }

var poiLayer = L.layerGroup().addTo(map);
function setPois(list) {
  poiLayer.clearLayers();
  list.forEach(function (p) {
    L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'poi ' + p.kind, html: p.kind === 'police' ? 'P' : 'H', iconSize: [26, 26] }) })
      .on('click', function () { send(p.id); }).addTo(poiLayer);
  });
}

var routeLayer = L.layerGroup().addTo(map);
function setRoute(u, d) {
  routeLayer.clearLayers();
  L.marker(d, { icon: L.divIcon({ className: 'poi dest', html: '&#9733;', iconSize: [26, 26] }), interactive: false }).addTo(routeLayer);
  if (u) {
    L.polyline([u, d], { color: '#208AEF', weight: 3, dashArray: '6 8' }).addTo(routeLayer);
    map.fitBounds([u, d], { paddingTopLeft: [40, 220], paddingBottomRight: [40, 150] });
  } else { map.setView(d, 15); }
}
function clearRoute() { routeLayer.clearLayers(); }
function fitMetro() { map.fitBounds([[-34.2, 18.3], [-33.55, 18.95]]); }

map.on('click', function () { send(null); });
var me = null;
function setMe(lat, lng) {
  if (me) { me.setLatLng([lat, lng]); return; }
  me = L.circleMarker([lat, lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#208AEF', fillOpacity: 1, interactive: false }).addTo(map);
}
</script></body></html>`;
}
