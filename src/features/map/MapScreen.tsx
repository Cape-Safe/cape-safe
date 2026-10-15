import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { CRIME_DATA_SOURCE, HEAT_POINTS } from "@/data/crime";
import { INCIDENTS } from "@/data/mock";
import { buildHtml } from "@/features/map/mapHtml";
import { drivingRoute, fetchNearbyPois, searchPlaces, type Place, type Poi } from "@/features/map/places";
import type { Coordinates } from "@/types";
import { BottomTabInset, useColorSchemeName, useTheme } from "@/ui/theme";
import { ThemedText, ThemedView } from "@/ui/themed";
import { formatKm, formatMinutes, haversineKm } from "@/utils/geo";
import { currentHour, formatHour, heatColor, riskAt, riskLabel } from "@/utils/risk";

const CITY_CENTER: Coordinates = { latitude: -33.9249, longitude: 18.4241 };
const LEGEND = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9];

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView type={on ? "backgroundSelected" : "backgroundElement"} style={styles.chip}>
        <ThemedText type="smallBold">{on ? "✓ " : ""}{label}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const dark = useColorSchemeName() === "dark";
  const webRef = useRef<WebView>(null);
  const html = useMemo(() => buildHtml(dark), [dark]);

  const [loadId, setLoadId] = useState(0); // bumps every time the WebView (re)loads
  const ready = loadId > 0;
  const [status, setStatus] = useState<string | null>("Loading map…");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<Coordinates | null>(null);

  // layer toggles
  const [incidentsOn, setIncidentsOn] = useState(true);
  const [heatOn, setHeatOn] = useState(false);
  const [poisOn, setPoisOn] = useState(false);

  // heat map time
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => new Date());

  // nearby hospitals + police
  const [poiResult, setPoiResult] = useState<{ key: string; list: Poi[]; note: string | null; failed: boolean } | null>(null);
  const [poiRetry, setPoiRetry] = useState(0);

  // destination search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dest, setDest] = useState<Place | null>(null);
  const [drive, setDrive] = useState<{ id: string; km: number; minutes: number } | null>(null);

  const origin = useMemo(() => userLoc ?? CITY_CENTER, [userLoc]);
  const poiKey = `${origin.latitude.toFixed(3)},${origin.longitude.toFixed(3)}`;
  const pois = useMemo(() => poiResult?.list ?? [], [poiResult]);
  const poiNote = poiResult?.note ?? null;
  const poisLoading = poisOn && poiResult?.key !== poiKey;

  const run = (js: string) => webRef.current?.injectJavaScript(`${js}; true;`);

  // ---- location ----
  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) return;
        const pos = await Location.getCurrentPositionAsync({});
        setUserLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {
        // location is optional
      }
    })();
  }, [ready]);

  useEffect(() => {
    if (ready && userLoc) run(`setMe(${userLoc.latitude}, ${userLoc.longitude})`);
  }, [loadId, ready, userLoc]);

  // ---- layers ----
  useEffect(() => {
    if (ready) run(`setIncidents(${incidentsOn})`);
  }, [loadId, ready, incidentsOn]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const hour = currentHour(offset, now);
  const scored = useMemo(() => HEAT_POINTS.map((p) => ({ p, w: riskAt(p, hour) })), [hour]);
  const top = scored.reduce((a, b) => (b.w > a.w ? b : a));

  useEffect(() => {
    if (!ready) return;
    const pts = scored.map(({ p, w }) => ({ lat: p.coordinates.latitude, lng: p.coordinates.longitude, r: p.radius, w }));
    run(`setHeat(${JSON.stringify(pts)}, ${heatOn})`);
  }, [loadId, ready, heatOn, scored]);

  // ---- nearby hospitals and police ----
  useEffect(() => {
    if (!poisOn) return;
    let live = true;
    fetchNearbyPois(origin)
      .then((list) => {
        if (live) setPoiResult({ key: poiKey, list, note: list.length ? null : "No hospitals or police stations found nearby.", failed: false });
      })
      .catch(() => {
        if (live) setPoiResult({ key: poiKey, list: [], note: null, failed: true });
      });
    return () => {
      live = false;
    };
  }, [poisOn, origin, poiKey, poiRetry]);

  useEffect(() => {
    if (!ready) return;
    const list = poisOn ? pois.map((p) => ({ id: p.id, kind: p.kind, lat: p.coordinates.latitude, lng: p.coordinates.longitude })) : [];
    run(`setPois(${JSON.stringify(list)})`);
  }, [loadId, ready, poisOn, pois]);

  const nearest = useMemo(() => {
    const pick = (kind: Poi["kind"]) =>
      pois
        .filter((p) => p.kind === kind)
        .map((p) => ({ p, km: haversineKm(origin, p.coordinates) }))
        .sort((a, b) => a.km - b.km)[0];
    return { hospital: pick("hospital"), police: pick("police") };
  }, [pois, origin]);

  // ---- destination ----
  const straightKm = dest && userLoc ? haversineKm(userLoc, dest.coordinates) : null;

  useEffect(() => {
    if (!dest || !userLoc) return;
    let live = true;
    drivingRoute(userLoc, dest.coordinates)
      .then((r) => {
        if (live && r) setDrive({ id: dest.id, ...r });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [dest, userLoc]);

  useEffect(() => {
    if (!ready) return;
    if (!dest) return run("clearRoute()");
    const d = `[${dest.coordinates.latitude}, ${dest.coordinates.longitude}]`;
    const u = userLoc ? `[${userLoc.latitude}, ${userLoc.longitude}]` : "null";
    run(`setRoute(${u}, ${d})`);
  }, [loadId, ready, dest, userLoc]);

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    Keyboard.dismiss();
    setSearching(true);
    setSearchError(null);
    try {
      const found = await searchPlaces(q, userLoc ?? undefined);
      setResults(found);
      if (!found.length) setSearchError("No places found. Try a different name.");
    } catch {
      setResults([]);
      setSearchError("Could not search right now. Check your internet connection.");
    } finally {
      setSearching(false);
    }
  };

  const pickPlace = (place: Place) => {
    Keyboard.dismiss();
    setResults([]);
    setQuery(place.name);
    setDrive(null);
    setDest(place);
    setSelectedId(null);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearchError(null);
    setDest(null);
    setDrive(null);
  };

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if ("error" in msg) setStatus(msg.error);
      else if ("loaded" in msg) setStatus(null);
      else setSelectedId(msg.id ?? null);
    } catch {
      setSelectedId(null);
    }
  };

  const toggleHeat = () => {
    const next = !heatOn;
    setHeatOn(next);
    if (next) run("fitMetro()"); // show the whole of Cape Town
    else setOffset(0);
  };

  // ---- selected marker card ----
  const incident = INCIDENTS.find((i) => i.id === selectedId);
  const poi = pois.find((p) => p.id === selectedId);
  const card = incident
    ? { title: incident.title, body: incident.description }
    : poi
      ? {
          title: poi.name,
          body: [
            poi.kind === "police" ? "Police station" : "Hospital",
            userLoc ? `${formatKm(haversineKm(userLoc, poi.coordinates))} from you` : null,
            poi.phone,
          ].filter(Boolean).join(" · "),
        }
      : null;
  const driveInfo = dest && drive?.id === dest.id ? drive : null;

  return (
    <View style={styles.flex}>
      <WebView
        ref={webRef}
        style={styles.flex}
        originWhitelist={["*"]}
        source={{ html }}
        javaScriptEnabled
        scrollEnabled={false}
        overScrollMode="never"
        onLoadEnd={() => setLoadId((n) => n + 1)}
        onMessage={onMessage}
        onError={(e) => setStatus(`WebView error: ${e.nativeEvent.description}`)}
        onHttpError={(e) => setStatus(`WebView HTTP error ${e.nativeEvent.statusCode}`)}
      />

      <View pointerEvents="box-none" style={[styles.top, { top: insets.top + 8 }]}>
        <ThemedView type="backgroundElement" style={styles.search}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Search a place in Cape Town"
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={runSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query || dest ? (
            <Pressable onPress={clearSearch} hitSlop={10}>
              <ThemedText type="smallBold">✕</ThemedText>
            </Pressable>
          ) : null}
          <Pressable onPress={runSearch} hitSlop={10}>
            <ThemedText type="link">{searching ? "…" : "Search"}</ThemedText>
          </Pressable>
        </ThemedView>

        {searchError ? (
          <ThemedView type="backgroundElement" style={styles.note}>
            <ThemedText type="small">{searchError}</ThemedText>
          </ThemedView>
        ) : null}

        {results.length ? (
          <ThemedView type="backgroundElement" style={styles.results}>
            {results.map((r) => (
              <Pressable key={r.id} onPress={() => pickPlace(r)} style={styles.result}>
                <ThemedText type="smallBold">{r.name}</ThemedText>
                {r.subtitle ? <ThemedText type="small" themeColor="textSecondary">{r.subtitle}</ThemedText> : null}
              </Pressable>
            ))}
          </ThemedView>
        ) : null}

        <View pointerEvents="box-none" style={styles.chips}>
          <Chip label="Incidents" on={incidentsOn} onPress={() => { setIncidentsOn((v) => !v); setSelectedId(null); }} />
          <Chip label="Heat map" on={heatOn} onPress={toggleHeat} />
          <Chip label="Hospitals & police" on={poisOn} onPress={() => { setPoisOn((v) => !v); setSelectedId(null); }} />
        </View>

        {heatOn ? (
          <ThemedView type="backgroundElement" style={styles.panel}>
            <ThemedText type="smallBold">
              Danger across Cape Town at {formatHour(hour)}{offset === 0 ? " (now)" : ""}
            </ThemedText>
            <View style={styles.legend}>
              {LEGEND.map((w) => (
                <View key={w} style={[styles.flex, { backgroundColor: heatColor(w) }]} />
              ))}
            </View>
            <View style={styles.rowBetween}>
              <ThemedText type="small" themeColor="textSecondary">Lower</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Higher</ThemedText>
            </View>
            <ThemedText type="small">Highest: {top.p.name} police area ({riskLabel(top.w)})</ThemedText>
            <View style={styles.rowBetween}>
              <Pressable onPress={() => setOffset((o) => o - 1)}>
                <ThemedText type="link">‹ 1h earlier</ThemedText>
              </Pressable>
              <Pressable onPress={() => setOffset(0)}>
                <ThemedText type="link">Now</ThemedText>
              </Pressable>
              <Pressable onPress={() => setOffset((o) => o + 1)}>
                <ThemedText type="link">1h later ›</ThemedText>
              </Pressable>
            </View>
            <ThemedText type="small" themeColor="textSecondary">{CRIME_DATA_SOURCE}</ThemedText>
          </ThemedView>
        ) : null}

        {poisOn ? (
          <ThemedView type="backgroundElement" style={styles.panel}>
            <ThemedText type="smallBold">
              Nearby help {userLoc ? "(from your location)" : "(from central Cape Town; location is off)"}
            </ThemedText>
            {poisLoading ? <ThemedText type="small">Looking for hospitals and police stations…</ThemedText> : null}
            {nearest.hospital ? (
              <ThemedText type="small">
                H  Nearest hospital: {nearest.hospital.p.name} ({formatKm(nearest.hospital.km)})
              </ThemedText>
            ) : null}
            {nearest.police ? (
              <ThemedText type="small">
                P  Nearest police: {nearest.police.p.name} ({formatKm(nearest.police.km)})
              </ThemedText>
            ) : null}
            {poiNote ? <ThemedText type="small" themeColor="textSecondary">{poiNote}</ThemedText> : null}
            {poiResult?.failed ? (
              <Pressable
                onPress={() => {
                  setPoiResult(null);
                  setPoiRetry((n) => n + 1);
                }}>
                <ThemedText type="link">Tap to load nearby places</ThemedText>
              </Pressable>
            ) : null}
          </ThemedView>
        ) : null}
      </View>

      <View pointerEvents="box-none" style={[styles.bottom, { bottom: insets.bottom + BottomTabInset + 8 }]}>
        {card ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">{card.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{card.body}</ThemedText>
          </ThemedView>
        ) : null}

        {dest ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">★ {dest.name}</ThemedText>
            {straightKm != null ? (
              <>
                <ThemedText type="small">{formatKm(straightKm)} from you in a straight line</ThemedText>
                {driveInfo ? (
                  <ThemedText type="small">
                    About {formatKm(driveInfo.km)} by road · {formatMinutes(driveInfo.minutes)} by car
                  </ThemedText>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">Checking the road distance…</ThemedText>
                )}
              </>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">Allow location to see how far this is from you.</ThemedText>
            )}
          </ThemedView>
        ) : null}

        {status ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small">{status}</ThemedText>
          </ThemedView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { position: "absolute", left: 12, right: 12, gap: 8 },
  bottom: { position: "absolute", left: 12, right: 12, gap: 8 },
  search: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 4 },
  input: { flex: 1, fontSize: 15, paddingVertical: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  note: { borderRadius: 12, padding: 10 },
  results: { borderRadius: 16, paddingVertical: 4 },
  result: { paddingVertical: 8, paddingHorizontal: 14 },
  panel: { borderRadius: 16, padding: 12, gap: 6 },
  legend: { flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  card: { borderRadius: 16, padding: 14, gap: 4 },
});
