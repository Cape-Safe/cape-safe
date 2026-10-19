import crimeStats from "./data/capeTownCrimeStats.json";
import suburbs from "./data/capeTownSuburbs.json";
import type { WeightedLatLng } from "./Heatmap";

// Weights follow SAPS's own crime categories, as documented in the dataset's
// codebook (docs/zar-saps-sapsacr-2005-2025-v1.4 2.json → study_info.notes):
//
//   CONTACT CRIMES (violence or threat of violence against a person) → highest
//     weight, since these are the direct personal-safety risk to a tourist.
//   CONTACT-RELATED CRIMES (arson, malicious damage) → violent, but aimed at
//     property rather than a person → medium weight.
//   CRIMES AGAINST PROPERTY (burglary, vehicle/stock theft) → victim usually
//     isn't present when it happens → lower weight.
//   OTHER SERIOUS CRIMES (shoplifting, commercial/fraud, other theft) → least
//     relevant to street safety → lowest weight.
//   CRIMES DEPENDENT ON POLICE ACTION (drugs, DUI, police-detected sex
//     offences) → excluded: the dataset's own analysis notes say a rise here
//     reflects policing activity, not community danger. illegal_firearms is
//     the one exception, kept as a direct gun-violence proxy.
const CRIME_WEIGHTS: Record<string, number> = {
  // contact crimes
  murder: 10,
  attempted_murder: 6,
  rape: 8,
  sexual_assault: 6,
  contact_sexoff: 6,
  attempted_sexoff: 4,
  kidnapping: 6,
  assault_gbh: 4,
  common_assault: 2,
  common_robbery: 3,
  aggr_robbery: 5,
  carjacking: 5,
  truck_hijacking: 3,
  bank_robbery: 3,
  cash_transit_robbery: 3,
  robbery_res: 4,
  robbery_nonres: 3,
  illegal_firearms: 3, // gun-violence proxy, not excluded like the other policing-action crimes
  // contact-related crimes
  arson: 2,
  malicious_damage: 1,
  // crimes against property
  burglary_res: 1.5,
  burglary_nonres: 1,
  vehicle_theft: 1,
  theft_from_vehicle: 1,
  stock_theft: 0.5,
  // other serious crimes
  other_theft: 0.5,
  commercial_crime: 0.5,
  shoplifting: 0.5,
  sexual_offences: 1,
  // dui, drug_crime, police_detected_sexoff: intentionally excluded
  // (policing-intensity indicators, not community risk)
};

// Crimes that target tourists, ranked separately so theft hotspots like Sea
// Point register. Shoplifting/commercial crime excluded (victim is a business).
const TOURIST_THEFT_WEIGHTS: Record<string, number> = {
  theft_from_vehicle: 3, // car break-ins
  common_robbery: 3, // muggings, bag/phone snatching with force
  other_theft: 2, // pickpocketing, theft of belongings
  vehicle_theft: 1,
};

// Violent crime counts double in the final blend.
const VIOLENT_SHARE = 2 / 3;

// Human-readable labels, taken from each variable's `labl` field in the SAPS
// codebook (docs/zar-saps-sapsacr-2005-2025-v1.4 2.json → variables[]).
const CRIME_LABELS: Record<string, string> = {
  murder: "Murder",
  attempted_murder: "Attempted murder",
  rape: "Rape",
  sexual_assault: "Sexual assault",
  contact_sexoff: "Contact sexual offences",
  attempted_sexoff: "Attempted sexual offences",
  kidnapping: "Kidnapping",
  assault_gbh: "Assault (grievous bodily harm)",
  common_assault: "Common assault",
  common_robbery: "Common robbery",
  aggr_robbery: "Robbery with aggravating circumstances",
  carjacking: "Carjacking",
  truck_hijacking: "Truck hijacking",
  bank_robbery: "Bank robbery",
  cash_transit_robbery: "Cash-in-transit robbery",
  robbery_res: "Robbery at residential premises",
  robbery_nonres: "Robbery at non-residential premises",
  arson: "Arson",
  malicious_damage: "Malicious damage to property",
  burglary_res: "Burglary at residential premises",
  burglary_nonres: "Burglary at non-residential premises",
  vehicle_theft: "Motor vehicle theft",
  theft_from_vehicle: "Theft from vehicles",
  stock_theft: "Stock theft",
  other_theft: "Other theft",
  commercial_crime: "Commercial crime (fraud)",
  shoplifting: "Shoplifting",
  sexual_offences: "Other sexual offences",
};

type StationStats = Record<string, number | string> & {
  station: string;
  locality: string;
  latitude: number;
  longitude: number;
};

export type StationRisk = {
  station: string;
  locality: string;
  latitude: number;
  longitude: number;
  weightedScore: number;
  violentRisk: number; // 0-1, percentile rank of the CRIME_WEIGHTS score
  theftRisk: number; // 0-1, percentile rank of the TOURIST_THEFT_WEIGHTS score
  risk: number; // 0-1, percentile rank of the violent/theft blend (1 = worst)
};

function rawValue(stats: StationStats, field: string): number {
  const value = stats[field];
  return typeof value === "number" ? value : 0;
}

// Crime counts live on wildly different scales — e.g. common_robbery runs
// into the thousands while murder tops out in the hundreds. Weighting raw
// counts directly lets high-volume, low-severity crime (theft, shoplifting)
// in busy commercial areas drown out high-weight violent crime elsewhere
// (this is exactly what pushed Cape Town Central above real Cape Flats
// hotspots like Delft/Nyanga in an earlier version of this score). So each
// field is min-max normalized to 0-1 across the station set *before* being
// weighted, capping every crime type's influence regardless of its scale.
function buildFieldRanges(stations: StationStats[]): Record<string, [number, number]> {
  const ranges: Record<string, [number, number]> = {};
  for (const field of Object.keys(CRIME_WEIGHTS)) {
    const values = stations.map((s) => rawValue(s, field));
    ranges[field] = [Math.min(...values), Math.max(...values)];
  }
  return ranges;
}

function weightedScore(
  stats: StationStats,
  ranges: Record<string, [number, number]>,
  weights: Record<string, number> = CRIME_WEIGHTS,
): number {
  let score = 0;
  for (const [field, weight] of Object.entries(weights)) {
    const [lo, hi] = ranges[field];
    const normalized = hi > lo ? (rawValue(stats, field) - lo) / (hi - lo) : 0;
    score += normalized * weight;
  }
  return score;
}

// Percentile rank rather than min-max: a few extreme hotspots would otherwise
// push most precincts near 0.
function percentileRanks(values: number[]): number[] {
  const order = values.map((_, i) => i).sort((a, b) => values[a] - values[b]);
  const last = values.length - 1;
  const ranks = new Array<number>(values.length);
  order.forEach((valueIndex, position) => {
    ranks[valueIndex] = last > 0 ? position / last : 0;
  });
  return ranks;
}

export function scoreStationRisk(): StationRisk[] {
  const stations = crimeStats.stations as StationStats[];
  const ranges = buildFieldRanges(stations);
  const violentScores = stations.map((s) => weightedScore(s, ranges));
  const theftScores = stations.map((s) =>
    weightedScore(s, ranges, TOURIST_THEFT_WEIGHTS),
  );
  const violentRanks = percentileRanks(violentScores);
  const theftRanks = percentileRanks(theftScores);
  const blendRanks = percentileRanks(
    stations.map(
      (_, i) => VIOLENT_SHARE * violentRanks[i] + (1 - VIOLENT_SHARE) * theftRanks[i],
    ),
  );

  return stations
    .map((s, i) => ({
      station: s.station,
      locality: s.locality,
      latitude: s.latitude,
      longitude: s.longitude,
      weightedScore: violentScores[i],
      violentRisk: violentRanks[i],
      theftRisk: theftRanks[i],
      risk: blendRanks[i],
    }))
    .sort((a, b) => b.risk - a.risk);
}

export type SuburbRisk = {
  suburb: string;
  latitude: number;
  longitude: number;
  station: string; // police precinct the suburb's score comes from
  risk: number; // 0-1, the precinct's risk
};

function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x =
    toRad(b.longitude - a.longitude) *
    Math.cos(toRad((a.latitude + b.latitude) / 2));
  const y = toRad(b.latitude - a.latitude);
  return 6371 * Math.hypot(x, y);
}

// SAPS data is per precinct, so each suburb takes its nearest station's risk.
let suburbRiskCache: SuburbRisk[] | undefined;

export function scoreSuburbRisk(): SuburbRisk[] {
  if (suburbRiskCache) return suburbRiskCache;
  const stations = scoreStationRisk();
  suburbRiskCache = suburbs.places.map((place) => {
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
      suburb: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      station: nearest.station,
      risk: nearest.risk,
    };
  });
  return suburbRiskCache;
}

// Ready to feed into buildHeatmapCircles() from ./Heatmap — risk becomes the
// heatmap intensity, so red = high risk / unsafe, green = low risk / safer.
export function getCapeTownCrimeHeatmapPoints(): WeightedLatLng[] {
  return scoreSuburbRisk().map((s) => ({
    latitude: s.latitude,
    longitude: s.longitude,
    intensity: s.risk,
  }));
}

export type RiskFactor = {
  field: string;
  label: string;
  count: number;
  contribution: number; // share of the violent/theft blend this crime accounts for
};

export type StationRiskDetail = StationRisk & {
  topFactors: RiskFactor[];
};

function findStationStats(stationName: string): StationStats | undefined {
  const stations = crimeStats.stations as StationStats[];
  return stations.find(
    (s) => s.station.toLowerCase() === stationName.toLowerCase(),
  );
}

export function getTopRiskFactors(
  stationName: string,
  topN = 3,
): RiskFactor[] {
  const stats = findStationStats(stationName);
  if (!stats) return [];

  const stations = crimeStats.stations as StationStats[];
  const ranges = buildFieldRanges(stations);
  const sum = (w: Record<string, number>) =>
    Object.values(w).reduce((a, b) => a + b, 0);
  const violentTotal = sum(CRIME_WEIGHTS);
  const theftTotal = sum(TOURIST_THEFT_WEIGHTS);

  return Object.keys(CRIME_WEIGHTS)
    .map((field) => {
      const count = rawValue(stats, field);
      const [lo, hi] = ranges[field];
      const normalized = hi > lo ? (count - lo) / (hi - lo) : 0;
      const weight =
        (VIOLENT_SHARE * CRIME_WEIGHTS[field]) / violentTotal +
        ((1 - VIOLENT_SHARE) * (TOURIST_THEFT_WEIGHTS[field] ?? 0)) / theftTotal;
      return {
        field,
        label: CRIME_LABELS[field] ?? field,
        count,
        contribution: normalized * weight,
      };
    })
    .filter((f) => f.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, topN);
}

export function getStationRiskDetail(
  stationName: string,
): StationRiskDetail | undefined {
  const match = scoreStationRisk().find(
    (s) => s.station.toLowerCase() === stationName.toLowerCase(),
  );
  if (!match) return undefined;

  return { ...match, topFactors: getTopRiskFactors(stationName) };
}

export type AreaRisk = StationRiskDetail & { suburb: string };

// Risk for whatever is at a map point: the nearest suburb and its precinct.
export function getAreaRiskAt(latitude: number, longitude: number): AreaRisk {
  const point = { latitude, longitude };
  let nearest = scoreSuburbRisk()[0];
  let nearestKm = Infinity;
  for (const suburb of scoreSuburbRisk()) {
    const km = distanceKm(point, suburb);
    if (km < nearestKm) {
      nearest = suburb;
      nearestKm = km;
    }
  }
  const detail = getStationRiskDetail(nearest.station) ?? getHighestRiskStation();
  return { ...detail, suburb: nearest.suburb };
}

// Fallback for a gauge/UI that isn't yet wired to "which area is the user
// looking at" — shows the single highest-risk station in the current scope.
export function getHighestRiskStation(): StationRiskDetail {
  const [top] = scoreStationRisk();
  return { ...top, topFactors: getTopRiskFactors(top.station) };
}

export const crimeRiskMeta = {
  year: crimeStats.year,
  source: crimeStats.source,
  scope: crimeStats.scope,
};
