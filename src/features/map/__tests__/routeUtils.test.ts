import {
  decodePolyline,
  externalDirectionsUrl,
  formatDistance,
  formatDuration,
  parseDuration,
  straightLineRoute,
} from "../routeUtils";

describe("decodePolyline", () => {
  it("decodes Google's documented example", () => {
    // From the Google polyline algorithm documentation.
    const points = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
    expect(points).toHaveLength(3);
    expect(points[0].latitude).toBeCloseTo(38.5, 5);
    expect(points[0].longitude).toBeCloseTo(-120.2, 5);
    expect(points[1].latitude).toBeCloseTo(40.7, 5);
    expect(points[1].longitude).toBeCloseTo(-120.95, 5);
    expect(points[2].latitude).toBeCloseTo(43.252, 5);
    expect(points[2].longitude).toBeCloseTo(-126.453, 5);
  });

  it("returns an empty list for an empty string", () => {
    expect(decodePolyline("")).toEqual([]);
  });
});

describe("formatting", () => {
  it("parses Routes API durations", () => {
    expect(parseDuration("845s")).toBe(845);
    expect(parseDuration(undefined)).toBe(0);
    expect(parseDuration("nonsense")).toBe(0);
  });

  it("formats distance", () => {
    expect(formatDistance(420)).toBe("420 m");
    expect(formatDistance(2350)).toBe("2.4 km");
    expect(formatDistance(18400)).toBe("18 km");
  });

  it("formats duration", () => {
    expect(formatDuration(20)).toBe("1 min");
    expect(formatDuration(25 * 60)).toBe("25 min");
    expect(formatDuration(60 * 60)).toBe("1 h");
    expect(formatDuration(95 * 60)).toBe("1 h 35 min");
  });
});

describe("straightLineRoute", () => {
  it("estimates a line, flagged as estimated", () => {
    const a = { latitude: -33.9249, longitude: 18.4241 };
    const b = { latitude: -33.9588, longitude: 18.4764 };
    const walk = straightLineRoute(a, b, "walk");
    const drive = straightLineRoute(a, b, "drive");
    expect(walk.estimated).toBe(true);
    expect(walk.points).toEqual([a, b]);
    expect(walk.distanceMeters).toBeGreaterThan(5000);
    expect(walk.durationSeconds).toBeGreaterThan(drive.durationSeconds);
  });
});

describe("externalDirectionsUrl", () => {
  const dest = { latitude: -33.9, longitude: 18.4 };
  it("uses Apple Maps on iOS", () => {
    expect(externalDirectionsUrl(dest, "walk", "ios")).toBe(
      "http://maps.apple.com/?daddr=-33.9,18.4&dirflg=w",
    );
  });
  it("uses Google Maps elsewhere", () => {
    expect(externalDirectionsUrl(dest, "drive", "android")).toContain(
      "travelmode=driving",
    );
  });
});
