import suburbs from "./data/capeTownSuburbs.json";
import { scoreStationRisk } from "./crimeRiskScore";
import type { WeightedLatLng } from "./Heatmap";

type LatLng = { latitude: number; longitude: number };

function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x =
    toRad(b.longitude - a.longitude) *
    Math.cos(toRad((a.latitude + b.latitude) / 2));
  const y = toRad(b.latitude - a.latitude);
  return 6371 * Math.hypot(x, y);
}

// SAPS data is per precinct, so each suburb borrows its nearest station's
// risk. Scoring is unchanged — this only adds more places to draw circles.
export function getSuburbHeatmapPoints(): WeightedLatLng[] {
  const stations = scoreStationRisk();
  return suburbs.places.map((place) => {
    let nearest = stations[0];
    let nearestKm = Infinity;
    for (const station of stations) {
      const km = distanceKm(place, station);
      if (km < nearestKm) {
        nearest = station;
        nearestKm = km;
      }
    }
    return {
      latitude: place.latitude,
      longitude: place.longitude,
      intensity: nearest.risk,
    };
  });
}
