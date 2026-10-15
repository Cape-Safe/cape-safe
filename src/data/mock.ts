import type { Incident, SafeSpot, Severity } from "@/types";

// SAMPLE DATA ONLY: replace with Firebase / API data later.

export const INCIDENTS: Incident[] = [
  { id: "i1", title: "Phone snatching", category: "Theft", severity: "high",
    description: "Reported near the station deck. Avoid using your phone while walking here.",
    coordinates: { latitude: -33.9222, longitude: 18.4251 }, reportedAt: "20 min ago" },
  { id: "i2", title: "Poor street lighting", category: "Hazard", severity: "medium",
    description: "Several streetlights are out along this stretch after dark.",
    coordinates: { latitude: -33.928, longitude: 18.447 }, reportedAt: "2 h ago" },
  { id: "i3", title: "Suspicious vehicle", category: "Suspicious activity", severity: "low",
    description: "Vehicle parked for hours with occupants watching passers-by.",
    coordinates: { latitude: -33.9156, longitude: 18.386 }, reportedAt: "5 h ago" },
  { id: "i4", title: "Bag theft from table", category: "Theft", severity: "medium",
    description: "Keep bags on your lap or strapped to your chair at outdoor tables.",
    coordinates: { latitude: -33.9036, longitude: 18.4207 }, reportedAt: "Yesterday" },
];

export const SAFE_SPOTS: SafeSpot[] = [
  { id: "s1", name: "Cape Town Central Police Station", kind: "police",
    phone: "021 467 8001", coordinates: { latitude: -33.9275, longitude: 18.43 } },
  { id: "s2", name: "Groote Schuur Hospital", kind: "hospital",
    phone: "021 404 9111", coordinates: { latitude: -33.9419, longitude: 18.4636 } },
];

export const EMERGENCY_NUMBERS = [
  { label: "Emergency (from cellphone)", number: "112" },
  { label: "Police (SAPS)", number: "10111" },
  { label: "Ambulance", number: "10177" },
  { label: "City of Cape Town emergency", number: "021 480 7700" },
];

export const SEVERITY_COLOR: Record<Severity, string> = {
  high: "#FF3B30",
  medium: "#FF9500",
  low: "#FFCC00",
};
