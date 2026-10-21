// mapRisk.ts
// Helpers that turn the team's crime risk scores (crimeRiskScore.ts) into
// the stations, labels and distances the map overlay needs.

import {
  getTopRiskFactors,
  scoreStationRisk,
  type RiskFactor,
  type StationRisk,
} from "./crimeRiskScore";

export type LatLng = { latitude: number; longitude: number };

export type Station = StationRisk & {
  name: string;
  topFactors: RiskFactor[];
};

export type RiskLevel = "lower" | "moderate" | "high";

// Cape Town centre. Used when the phone has not given us a location yet.
export const DEFAULT_USER_LOCATION: LatLng = {
  latitude: -33.9249,
  longitude: 18.4241,
};

function titleCase(name: string) {
  return name
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function loadStations(): Station[] {
  return scoreStationRisk().map((station) => ({
    ...station,
    name: titleCase(station.station),
    topFactors: getTopRiskFactors(station.station),
  }));
}

// Same thresholds as RiskGauge.tsx.
export function riskLevel(risk: number): RiskLevel {
  if (risk >= 0.66) return "high";
  if (risk >= 0.33) return "moderate";
  return "lower";
}

export function riskLabel(level: RiskLevel) {
  if (level === "high") return "High risk";
  if (level === "moderate") return "Moderate risk";
  return "Lower risk";
}

export function distanceKm(a: LatLng, b: LatLng) {
  const toRad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * toRad;
  const dLng = (b.longitude - a.longitude) * toRad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * toRad) *
      Math.cos(b.latitude * toRad) *
      Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function stationLocation(station: Station): LatLng {
  return { latitude: station.latitude, longitude: station.longitude };
}

export function nearestStation(stations: Station[], from: LatLng): Station {
  let best = stations[0];
  let bestDistance = distanceKm(from, stationLocation(best));
  for (const station of stations) {
    const d = distanceKm(from, stationLocation(station));
    if (d < bestDistance) {
      best = station;
      bestDistance = d;
    }
  }
  return best;
}

// Roughly how far to zoom so both the user and the station fit on screen.
export function zoomForDistance(km: number) {
  if (km < 1) return 15;
  if (km < 3) return 14;
  if (km < 8) return 13;
  return 12;
}

// Risk around any point on the map, borrowed from the nearest police precinct
// (the SAPS data is per station, not per street).
export function riskNear(stations: Station[], point: LatLng) {
  if (stations.length === 0) return null;
  const station = nearestStation(stations, point);
  return {
    station,
    level: riskLevel(station.risk),
    score: Math.round(station.risk * 100),
  };
}
