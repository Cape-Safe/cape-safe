import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
  crimeRiskMeta,
  getHighestRiskStation,
  type AreaRisk,
  type StationRiskDetail,
} from "./crimeRiskScore";
import { DEFAULT_GRADIENT, sampleGradient } from "./Heatmap";

const BAR_WIDTH = 18;
const BAR_HEIGHT = 180;
const CAPSULE_PADDING = 10;
const BAND_COUNT = 48;
const BADGE_HEIGHT = 26;

// Same colour scale as the heatmap circles, so the badge matches the map.
function riskColor(risk: number) {
  const { r, g, b } = sampleGradient(DEFAULT_GRADIENT, risk);
  return `rgb(${r}, ${g}, ${b})`;
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
  area?: AreaRisk;
};

export default function RiskGauge({ area }: RiskGaugeProps) {
  const [visible, setVisible] = useState(false);
  const detail: StationRiskDetail = area ?? getHighestRiskStation();
  const suburb = area?.suburb;

  // top of the bar = highest risk
  const bands = useMemo(
    () =>
      Array.from({ length: BAND_COUNT }, (_, i) =>
        riskColor(1 - i / (BAND_COUNT - 1)),
      ),
    [],
  );

  const score = Math.round(detail.risk * 100);
  const color = riskColor(detail.risk);
  const badgeTop =
    CAPSULE_PADDING + (1 - detail.risk) * BAR_HEIGHT - BADGE_HEIGHT / 2;

  return (
    <>
      <View style={styles.container} pointerEvents="box-none">
        <Pressable
          onPress={() => setVisible(true)}
          style={styles.infoButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="About this risk score"
        >
          <Text style={styles.infoText}>i</Text>
        </Pressable>

        <Pressable
          onPress={() => setVisible(true)}
          style={styles.capsule}
          accessibilityRole="button"
          accessibilityLabel={`Risk score ${score} out of 100${suburb ? ` for ${suburb}` : ""}`}
        >
          <View style={styles.bar}>
            {bands.map((c, i) => (
              <View key={i} style={[styles.band, { backgroundColor: c }]} />
            ))}
          </View>
          <View style={[styles.badge, { top: badgeTop, backgroundColor: color }]}>
            <Text style={styles.badgeText} numberOfLines={1}>
              ◂ {score}
            </Text>
          </View>
        </Pressable>
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.cardTitle}>
              {suburb ?? titleCase(detail.station)}
            </Text>
            {suburb ? (
              <Text style={styles.cardPrecinct}>
                {titleCase(detail.station)} police precinct
              </Text>
            ) : null}
            <Text style={[styles.cardRisk, { color }]}>
              {score}/100 · {riskLabel(detail.risk)}
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
              {crimeRiskMeta.scope} · FY {crimeRiskMeta.year} ·{" "}
              {crimeRiskMeta.source}
            </Text>

            <Pressable
              style={styles.closeButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    bottom: 24,
    alignItems: "center",
    gap: 10,
  },
  infoButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#6b7280",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6b7280",
    fontStyle: "italic",
  },
  capsule: {
    backgroundColor: "#ffffff",
    borderRadius: (BAR_WIDTH + CAPSULE_PADDING * 2) / 2,
    padding: CAPSULE_PADDING,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
  badge: {
    position: "absolute",
    left: BAR_WIDTH + CAPSULE_PADDING + 4,
    height: BADGE_HEIGHT,
    minWidth: 58,
    borderRadius: BADGE_HEIGHT / 2,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
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
  cardPrecinct: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  cardRisk: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  cardSubheading: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
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
