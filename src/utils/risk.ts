import type { HeatPoint } from "@/types";

/** Danger 0-1 for an area at a given hour of day, interpolated between the hourly values. */
export function riskAt(point: HeatPoint, hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const lo = Math.floor(h) % 24;
  const hi = (lo + 1) % 24;
  const t = h - Math.floor(h);
  return point.hourly[lo] * (1 - t) + point.hourly[hi] * t;
}

export function riskLabel(risk: number) {
  return risk < 0.3 ? "Lower" : risk < 0.6 ? "Moderate" : "High";
}

/** Hour of day (0-24, with minutes as a fraction), shifted by an optional offset in hours. */
export function currentHour(offsetHours = 0, now = new Date()) {
  return (((now.getHours() + now.getMinutes() / 60 + offsetHours) % 24) + 24) % 24;
}

export function formatHour(hour: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(hour))}:${pad(Math.floor((hour % 1) * 60))}`;
}

/** Green (lower) to red (higher). */
export function heatColor(risk: number) {
  return `hsl(${Math.round(120 * (1 - Math.min(1, Math.max(0, risk))))}, 90%, 50%)`;
}
