#!/usr/bin/env node

// Regenerates src/features/map/data/capeTownSuburbs.json from OpenStreetMap.
// Usage: node scripts/fetch-suburbs.js

const fs = require("fs");
const path = require("path");

const OUTPUT = path.join(__dirname, "../src/features/map/data/capeTownSuburbs.json");
const CRIME_STATS = path.join(__dirname, "../src/features/map/data/capeTownCrimeStats.json");
const ENDPOINT = "https://overpass-api.de/api/interpreter";

const QUERY = `[out:json][timeout:120];
area["name"="City of Cape Town"]["admin_level"="6"]->.ct;
nwr["place"~"^(suburb|town|village|quarter|neighbourhood|hamlet)$"](area.ct);
out center tags;`;

const PRIMARY = new Set(["suburb", "town", "village", "quarter"]);
// Neighbourhoods/hamlets only fill gaps between suburbs.
const SECONDARY_MIN_GAP_KM = 1;
// Drops far-off metro territory (e.g. Marion Island) with no precinct data.
const MAX_STATION_DISTANCE_KM = 8;
const TYPE_ORDER = { node: 0, relation: 1, way: 2 };

function distanceKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const x = toRad(b.longitude - a.longitude) * Math.cos(toRad((a.latitude + b.latitude) / 2));
  const y = toRad(b.latitude - a.latitude);
  return 6371 * Math.hypot(x, y);
}

async function fetchOverpass(attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "cape-safe/1.0 (student project)",
      },
      body: new URLSearchParams({ data: QUERY }),
    });
    if (res.ok) return res.json();
    const wait = 2 ** i * 5;
    console.warn(`Overpass returned ${res.status}, retrying in ${wait}s…`);
    await new Promise((r) => setTimeout(r, wait * 1000));
  }
  throw new Error("Overpass API unavailable — try again later.");
}

async function main() {
  const { stations } = JSON.parse(fs.readFileSync(CRIME_STATS, "utf8"));
  const { elements } = await fetchOverpass();

  const candidates = elements
    .map((el) => ({
      type: el.type,
      id: el.id,
      place: el.tags.place,
      name: (el.tags.name ?? "").trim(),
      latitude: el.lat ?? el.center?.lat,
      longitude: el.lon ?? el.center?.lon,
    }))
    .filter((p) => p.name && p.latitude != null)
    .filter((p) => stations.some((s) => distanceKm(p, s) <= MAX_STATION_DISTANCE_KM))
    .sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.id - b.id);

  const places = new Map();
  for (const primaryTier of [true, false]) {
    for (const p of candidates) {
      if (PRIMARY.has(p.place) !== primaryTier) continue;
      const key = p.name.toLowerCase();
      if (places.has(key)) continue;
      if (!primaryTier && [...places.values()].some((q) => distanceKm(p, q) < SECONDARY_MIN_GAP_KM)) {
        continue;
      }
      places.set(key, {
        name: p.name,
        latitude: Number(p.latitude.toFixed(5)),
        longitude: Number(p.longitude.toFixed(5)),
      });
    }
  }

  const sorted = [...places.values()].sort((a, b) => a.name.localeCompare(b.name));
  const output = {
    source:
      "OpenStreetMap place features (suburb, town, village, quarter; neighbourhood/hamlet only where no suburb lies within 1 km) inside the City of Cape Town boundary, via the Overpass API. Areas use their centre point. © OpenStreetMap contributors, ODbL. Regenerate with: node scripts/fetch-suburbs.js",
    fetched: new Date().toISOString().slice(0, 10),
    places: sorted,
  };
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 1) + "\n");
  console.log(`Wrote ${sorted.length} places to ${path.relative(process.cwd(), OUTPUT)}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
