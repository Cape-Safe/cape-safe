export type WeightedLatLng = {
  latitude: number;
  longitude: number;
  intensity?: number; // defaults to 1.0
};

export type HeatmapGradientStop = {
  color: { r: number; g: number; b: number };
  start: number; // 0-1
};

export type HeatmapOptions = {
  radius?: number;
  gradient?: HeatmapGradientStop[]; // min 1
  opacity?: number;
};

export type HeatmapCircle = {
  id: string;
  center: { latitude: number; longitude: number };
  radius: number;
  color: string;
  lineColor: string;
  lineWidth: number;
};

const DEFAULT_GRADIENT: HeatmapGradientStop[] = [
  { color: { r: 34, g: 197, b: 94 }, start: 0.2 }, // green
  { color: { r: 234, g: 179, b: 8 }, start: 0.6 }, // yellow
  { color: { r: 239, g: 68, b: 68 }, start: 1.0 }, // red
];

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function sampleGradient(gradient: HeatmapGradientStop[], t: number) {
  const sorted = [...gradient].sort((a, b) => a.start - b.start);
  if (t <= sorted[0].start) return sorted[0].color;
  const last = sorted[sorted.length - 1];
  if (t >= last.start) return last.color;

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (t >= a.start && t <= b.start) {
      const localT = (t - a.start) / (b.start - a.start);
      return {
        r: lerp(a.color.r, b.color.r, localT),
        g: lerp(a.color.g, b.color.g, localT),
        b: lerp(a.color.b, b.color.b, localT),
      };
    }
  }
  return last.color;
}

export function buildHeatmapCircles(
  points: WeightedLatLng[],
  options?: HeatmapOptions,
): HeatmapCircle[] {
  if (points.length === 0) return [];

  const radius = options?.radius ?? 1600;
  const gradient = options?.gradient ?? DEFAULT_GRADIENT;
  const opacity = options?.opacity ?? 0.8;

  const maxIntensity = Math.max(...points.map((p) => p.intensity ?? 1));
  const circles: HeatmapCircle[] = [];

  points.forEach((point, index) => {
    const intensity = point.intensity ?? 1;
    const t = maxIntensity > 0 ? intensity / maxIntensity : 0;
    const { r, g, b } = sampleGradient(gradient, t);
    const center = { latitude: point.latitude, longitude: point.longitude };
    const pointRadius = radius * (0.4 + 0.6 * t);

    // outer soft ring + denser inner core approximates the Gaussian blur
    // GMUHeatmapTileLayer produces natively
    circles.push({
      id: `heat-${index}-outer`,
      center,
      radius,
      color: `rgba(${r}, ${g}, ${b}, ${(0.18 * opacity).toFixed(3)})`,
      lineColor: "transparent",
      lineWidth: 0,
    });
    circles.push({
      id: `heat-${index}-inner`,
      center,
      radius: radius * 0.45,
      color: `rgba(${r}, ${g}, ${b}, ${(0.4 * opacity).toFixed(3)})`,
      lineColor: "transparent",
      lineWidth: 0,
    });
  });

  return circles;
}
