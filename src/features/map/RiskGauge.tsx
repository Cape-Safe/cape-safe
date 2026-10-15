import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
  crimeRiskMeta,
  getHighestRiskStation,
  type StationRiskDetail,
} from "./crimeRiskScore";

const BAR_WIDTH = 14;
const BAR_HEIGHT = 130;
const BAND_COUNT = 32;

// red (top/high risk) -> yellow (mid) -> green (bottom/low risk), matching
// the heatmap's gradient direction in ./Heatmap.
const GRADIENT_STOPS: { stop: number; color: [number, number, number] }[] = [
  { stop: 0, color: [239, 68, 68] },
  { stop: 0.5, color: [234, 179, 8] },
  { stop: 1, color: [34, 197, 94] },
];

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function sampleBand(t: number): string {
  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    const a = GRADIENT_STOPS[i];
    const b = GRADIENT_STOPS[i + 1];
    if (t >= a.stop && t <= b.stop) {
      const localT = (t - a.stop) / (b.stop - a.stop);
      const [r1, g1, b1] = a.color;
      const [r2, g2, b2] = b.color;
      return `rgb(${lerp(r1, r2, localT)}, ${lerp(g1, g2, localT)}, ${lerp(b1, b2, localT)})`;
    }
  }
  const last = GRADIENT_STOPS[GRADIENT_STOPS.length - 1].color;
  return `rgb(${last[0]}, ${last[1]}, ${last[2]})`;
}

function titleCase(name: string) {
  return name
    .split(" ")
    .map((word) =>
      word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word,
    )
    .join(" ");
}

function riskLabel(risk: number) {
  if (risk >= 0.66) return "High risk";
  if (risk >= 0.33) return "Moderate risk";
  return "Lower risk";
}

type RiskGaugeProps = {
  station?: StationRiskDetail; // defaults to the city's highest-risk station
};

export default function RiskGauge({ station }: RiskGaugeProps) {
  const [visible, setVisible] = useState(false);
  const detail = station ?? getHighestRiskStation();

  const bands = useMemo(
    () =>
      Array.from({ length: BAND_COUNT }, (_, i) =>
        sampleBand(i / (BAND_COUNT - 1)),
      ),
    [],
  );

  const percent = Math.round(detail.risk * 100);
  // risk 1 (high) sits at the top of the bar, risk 0 (low) at the bottom
  const markerTop = (1 - detail.risk) * BAR_HEIGHT;
  const color = sampleBand(1 - detail.risk);

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={styles.capsule}
        hitSlop={8}
      >
        <View style={styles.bar}>
          {bands.map((c, i) => (
            <View key={i} style={[styles.band, { backgroundColor: c }]} />
          ))}
          <View style={[styles.marker, { top: markerTop - 7 }]}>
            <View style={[styles.badge, { borderColor: color }]}>
              <Text style={[styles.badgeText, { color }]}>{percent}%</Text>
            </View>
          </View>
        </View>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.cardTitle}>{titleCase(detail.station)}</Text>
            <Text style={[styles.cardRisk, { color }]}>
              {percent}% · {riskLabel(detail.risk)}
            </Text>

            {detail.topFactors.length > 0 ? (
              <>
                <Text style={styles.cardSubheading}>Main contributors</Text>
                {detail.topFactors.map((f) => (
                  <Text key={f.field} style={styles.factorRow}>
                    • {f.label} — {f.count.toLocaleString()} cases
                  </Text>
                ))}
              </>
            ) : (
              <Text style={styles.factorRow}>No reported cases on file.</Text>
            )}

            <Text style={styles.cardFootnote}>
              {crimeRiskMeta.scope} · FY {crimeRiskMeta.year} · {crimeRiskMeta.source}
            </Text>

            <Pressable style={styles.closeButton} onPress={() => setVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  capsule: {
    position: "absolute",
    left: 16,
    bottom: 16,
    backgroundColor: "#ffffff",
    borderRadius: BAR_WIDTH,
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  bar: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: BAR_WIDTH / 2,
    overflow: "hidden",
  },
  band: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT / BAND_COUNT,
  },
  marker: {
    position: "absolute",
    left: -6,
    right: -6,
    alignItems: "flex-end",
  },
  badge: {
    position: "absolute",
    left: BAR_WIDTH + 4,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  cardRisk: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 12,
  },
  cardSubheading: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
  },
  factorRow: {
    fontSize: 14,
    color: "#1f2937",
    marginBottom: 2,
  },
  cardFootnote: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 14,
  },
  closeButton: {
    marginTop: 16,
    alignSelf: "flex-end",
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },
});
