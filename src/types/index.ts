import type { Timestamp } from "firebase/firestore";

export type Coordinates = { latitude: number; longitude: number };

export type EmergencyContact = {
  name: string;
  phone: string;
  relation?: string;
};

export type UserSettings = {
  pushAlerts: boolean;
  shareLocationByDefault: boolean;
  largeText: boolean;
  colourBlindMode: boolean;
};

export type UserProfile = {
  displayName: string;
  email?: string;
  phone?: string;
  homeCountry?: string;
  avatarUrl?: string;
  emergencyContacts?: EmergencyContact[];
  locationSharing?: boolean;
  groupIds: string[];
  settings?: UserSettings;
  createdAt?: Timestamp;
};

export type Group = {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: Timestamp;
};

export type MemberLocation = {
  uid: string;
  displayName: string;
  coordinates: Coordinates;
  accuracy: number;
  updatedAt: Timestamp;
};

export type Area = {
  id: string;
  station: string;
  name: string;
  municipality: string;
  district: string;
  center: Coordinates;
  reportCount: number;
  ratingTotal: number;
  lastReportAt: Timestamp | null;
};

export type Report = {
  id: string;
  authorId: string;
  areaId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  hour: number;
  coordinates?: Coordinates;
  status: "visible" | "hidden";
  createdAt: Timestamp;
};

export type SafetyAlert = {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "urgent";
  areaIds: string[];
  startsAt: Timestamp;
  expiresAt: Timestamp;
  createdAt: Timestamp;
};

// ── Map search and directions ───────────────────────────────────────────
export type TravelMode = "drive" | "walk";

/** One row in the search suggestions list (also used for recent searches). */
export type PlaceSuggestion = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
};

export type RouteSummary = {
  mode: TravelMode;
  distanceMeters: number;
  durationSeconds: number;
  points: Coordinates[];
  /** True when this is a straight line estimate, not a real road route. */
  estimated: boolean;
};

// ── Emergency profile and document vault (private to the user) ──────────
export type NextOfKin = {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  country?: string;
};

export type MedicalAidInfo = {
  provider?: string;
  memberNumber?: string;
  planName?: string;
  assistancePhone?: string;
  /** YYYY-MM-DD */
  expiry?: string;
};

export type EmergencyProfile = {
  fullName?: string;
  /** YYYY-MM-DD */
  dateOfBirth?: string;
  nationality?: string;
  homeCountry?: string;
  /** Passport or national ID number. Never log this. */
  idNumber?: string;
  phone?: string;
  bloodType?: string;
  allergies?: string;
  conditions?: string;
  medication?: string;
  medicalNotes?: string;
  medicalAid?: MedicalAidInfo;
  nextOfKin: NextOfKin[];
  accommodationName?: string;
  accommodationAddress?: string;
  /** Set the first time the user accepts the privacy notice. */
  consentAcceptedAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type DocumentType =
  | "id"
  | "medical_aid_card"
  | "insurance_policy"
  | "other";

export type UserDocument = {
  id: string;
  type: DocumentType;
  label: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Timestamp;
};
