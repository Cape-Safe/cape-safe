import { distanceKm, riskLevel, zoomForDistance } from "../mapRisk";

describe("mapRisk helpers", () => {
  it("measures the distance between two points", () => {
    // Cape Town centre to Table Mountain cable station is roughly 3 km.
    const km = distanceKm(
      { latitude: -33.9249, longitude: 18.4241 },
      { latitude: -33.9488, longitude: 18.4033 },
    );
    expect(km).toBeGreaterThan(2.5);
    expect(km).toBeLessThan(4);
  });

  it("returns zero for identical points", () => {
    const p = { latitude: -33.9, longitude: 18.4 };
    expect(distanceKm(p, p)).toBe(0);
  });

  it("maps scores to risk levels with the gauge thresholds", () => {
    expect(riskLevel(0)).toBe("lower");
    expect(riskLevel(0.33)).toBe("moderate");
    expect(riskLevel(0.66)).toBe("high");
  });

  it("zooms out as distance grows", () => {
    expect(zoomForDistance(0.5)).toBeGreaterThan(zoomForDistance(10));
  });
});
