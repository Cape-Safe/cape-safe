export type Coordinates = { latitude: number; longitude: number };

export type Severity = "low" | "medium" | "high";

export type Incident = {
  id: string;
  title: string;
  category: string;
  description: string;
  severity: Severity;
  coordinates: Coordinates;
  reportedAt: string;
};

export type SafeSpot = {
  id: string;
  name: string;
  kind: "police" | "hospital";
  phone: string;
  coordinates: Coordinates;
};

export type HeatPoint = {
  id: string;
  name: string;
  coordinates: Coordinates;
  /** Size of the heat blob in metres. */
  radius: number;
  /** Average reported offences per year counted for this police station. */
  annual: number;
  /** Danger for each hour of the day (index 0 = 00:00), scaled 0 to 1. */
  hourly: number[];
};
