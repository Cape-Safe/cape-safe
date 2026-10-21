import { parseRoute } from "@/services/directions";
import { parseAutocomplete, parseDetails } from "@/services/places";
import type { PlaceSuggestion } from "@/types";

import { addRecent, MAX_RECENTS } from "../recentSearches";
import { riskNear, type Station } from "../mapRisk";

describe("parseAutocomplete", () => {
  it("maps predictions and skips malformed ones", () => {
    const out = parseAutocomplete({
      suggestions: [
        {
          placePrediction: {
            placeId: "abc",
            structuredFormat: {
              mainText: { text: "V&A Waterfront" },
              secondaryText: { text: "Cape Town, South Africa" },
            },
          },
        },
        { placePrediction: { text: { text: "no id" } } },
        {},
      ],
    });
    expect(out).toEqual([
      {
        placeId: "abc",
        primaryText: "V&A Waterfront",
        secondaryText: "Cape Town, South Africa",
      },
    ]);
  });

  it("copes with an empty response", () => {
    expect(parseAutocomplete({})).toEqual([]);
    expect(parseAutocomplete(null)).toEqual([]);
  });
});

describe("parseDetails", () => {
  it("reads name, address and location", () => {
    expect(
      parseDetails({
        id: "abc",
        displayName: { text: "Table Mountain" },
        formattedAddress: "Cape Town",
        location: { latitude: -33.96, longitude: 18.4 },
      }),
    ).toEqual({
      placeId: "abc",
      name: "Table Mountain",
      address: "Cape Town",
      coordinates: { latitude: -33.96, longitude: 18.4 },
    });
  });

  it("returns null when there is no location", () => {
    expect(parseDetails({ id: "abc" })).toBeNull();
  });
});

describe("parseRoute", () => {
  it("decodes a route response", () => {
    const route = parseRoute(
      {
        routes: [
          {
            distanceMeters: 1200,
            duration: "300s",
            polyline: { encodedPolyline: "_p~iF~ps|U_ulLnnqC" },
          },
        ],
      },
      "drive",
    );
    expect(route.distanceMeters).toBe(1200);
    expect(route.durationSeconds).toBe(300);
    expect(route.points).toHaveLength(2);
    expect(route.estimated).toBe(false);
  });

  it("throws when Google finds no route", () => {
    expect(() => parseRoute({}, "walk")).toThrow();
  });
});

describe("addRecent", () => {
  const item = (n: number): PlaceSuggestion => ({
    placeId: `p${n}`,
    primaryText: `Place ${n}`,
    secondaryText: "",
  });

  it("puts the newest first and removes duplicates", () => {
    const list = addRecent([item(1), item(2)], item(2));
    expect(list.map((r) => r.placeId)).toEqual(["p2", "p1"]);
  });

  it("keeps only the last five", () => {
    let list: PlaceSuggestion[] = [];
    for (let i = 1; i <= 8; i++) list = addRecent(list, item(i));
    expect(list).toHaveLength(MAX_RECENTS);
    expect(list[0].placeId).toBe("p8");
  });
});

describe("riskNear", () => {
  const station = (name: string, lat: number, lng: number, risk: number) =>
    ({
      station: name,
      name,
      locality: name,
      latitude: lat,
      longitude: lng,
      weightedScore: risk,
      risk,
      topFactors: [],
    }) as Station;

  const stations = [
    station("calm", -33.9, 18.4, 0.1),
    station("rough", -34.0, 18.6, 0.9),
  ];

  it("uses the nearest station's score", () => {
    const result = riskNear(stations, { latitude: -34.0, longitude: 18.59 });
    expect(result?.station.name).toBe("rough");
    expect(result?.level).toBe("high");
    expect(result?.score).toBe(90);
  });

  it("returns null with no stations", () => {
    expect(riskNear([], { latitude: 0, longitude: 0 })).toBeNull();
  });
});
