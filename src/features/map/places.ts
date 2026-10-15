import type { Coordinates } from "@/types";
import { haversineKm } from "@/utils/geo";



export type Place = { id: string; name: string; subtitle?: string; coordinates: Coordinates };
export type Poi = { id: string; kind: "hospital" | "police"; name: string; coordinates: Coordinates; phone?: string };

async function getJson(url: string, ms = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Rough box around the City of Cape Town: minLon, minLat, maxLon, maxLat
const CAPE_TOWN_BBOX = "18.2,-34.5,19.1,-33.4";

export async function searchPlaces(query: string, near?: Coordinates): Promise<Place[]> {
  let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en&bbox=${CAPE_TOWN_BBOX}`;
  if (near) url += `&lat=${near.latitude}&lon=${near.longitude}`;
  const json = await getJson(url);
  const features: any[] = json?.features ?? [];
  return features
    .filter((f) => Array.isArray(f?.geometry?.coordinates))
    .map((f, i) => {
      const p = f.properties ?? {};
      const street = [p.street, p.housenumber].filter(Boolean).join(" ");
      const name = p.name || street || "Unnamed place";
      const subtitle = [name !== street ? street : null, p.district ?? p.locality, p.city].filter(Boolean).join(", ");
      const [lon, lat] = f.geometry.coordinates;
      return { id: `${p.osm_type ?? "x"}${p.osm_id ?? i}`, name, subtitle, coordinates: { latitude: lat, longitude: lon } };
    });
}

// Public Overpass servers are often busy (or refuse some apps), so ask several at once
// and use the first answer. If all of them fail, fall back to Photon, which is the same
// service the place search uses.
const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];
const USER_AGENT = "CapeSafe/1.0 (university project)";

function firstSuccess<T>(tasks: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    let failed = 0;
    tasks.forEach((t) =>
      t.then(resolve, () => {
        if (++failed === tasks.length) reject(new Error("all servers failed"));
      }),
    );
  });
}

async function overpassPois(center: Coordinates, radiusM: number): Promise<Poi[]> {
  const q = `[out:json][timeout:20];nwr["amenity"~"^(hospital|police)$"](around:${radiusM},${center.latitude},${center.longitude});out center 80;`;
  const json = await firstSuccess(
    OVERPASS_SERVERS.map(async (server) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(server, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
          body: `data=${encodeURIComponent(q)}`,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        console.warn(`[places] ${server}: ${String(e)}`);
        throw e;
      } finally {
        clearTimeout(timer);
      }
    }),
  );
  const out: Poi[] = [];
  for (const el of json?.elements ?? []) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const kind = el.tags?.amenity;
    if (lat == null || lon == null || (kind !== "hospital" && kind !== "police")) continue;
    out.push({
      id: `poi-${el.type}-${el.id}`,
      kind,
      name: el.tags?.name ?? (kind === "police" ? "Police station" : "Hospital"),
      coordinates: { latitude: lat, longitude: lon },
      phone: el.tags?.phone ?? el.tags?.["contact:phone"],
    });
  }
  return out;
}

async function photonPois(center: Coordinates, maxKm: number): Promise<Poi[]> {
  const searches: { q: string; kind: Poi["kind"] }[] = [
    { q: "hospital", kind: "hospital" },
    { q: "police", kind: "police" },
    { q: "saps", kind: "police" },
  ];
  const lists = await Promise.all(
    searches.map(async ({ q, kind }) => {
      const url =
        `https://photon.komoot.io/api/?q=${q}&osm_tag=amenity:${kind}` +
        `&lat=${center.latitude}&lon=${center.longitude}&limit=20&lang=en`;
      const json = await getJson(url);
      const found: Poi[] = [];
      for (const f of json?.features ?? []) {
        const c = f?.geometry?.coordinates;
        if (!Array.isArray(c)) continue;
        const coordinates = { latitude: c[1], longitude: c[0] };
        if (haversineKm(center, coordinates) > maxKm) continue;
        const p = f.properties ?? {};
        found.push({
          id: `poi-${p.osm_type ?? "x"}-${p.osm_id ?? `${c[0]},${c[1]}`}`,
          kind,
          name: p.name ?? (kind === "police" ? "Police station" : "Hospital"),
          coordinates,
        });
      }
      return found;
    }),
  );
  const seen = new Set<string>();
  return lists.flat().filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

export async function fetchNearbyPois(center: Coordinates, radiusM = 8000): Promise<Poi[]> {
  try {
    return await overpassPois(center, radiusM);
  } catch {
    console.warn("[places] Overpass failed, using Photon instead");
    return photonPois(center, 15);
  }
}

export async function drivingRoute(from: Coordinates, to: Coordinates): Promise<{ km: number; minutes: number } | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=false`;
  const json = await getJson(url, 10000);
  const r = json?.routes?.[0];
  return r ? { km: r.distance / 1000, minutes: r.duration / 60 } : null;
}
