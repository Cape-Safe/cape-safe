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
