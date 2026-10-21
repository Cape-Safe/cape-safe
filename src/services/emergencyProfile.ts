// emergencyProfile.ts
// The user's emergency details live in ONE private document:
// users/{uid}/private/emergencyProfile. Only the signed-in (non-guest) owner
// can read or write it (see firestore.rules). Never log its contents.

import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type FieldValue,
  type Timestamp,
} from "firebase/firestore";

import { db } from "@/services/firebase";
import type { EmergencyProfile } from "@/types";

const profileRef = (uid: string) =>
  doc(db, "users", uid, "private", "emergencyProfile");

/** Live updates. `null` means the user hasn't saved anything yet. */
export function subscribeToEmergencyProfile(
  uid: string,
  onChange: (profile: EmergencyProfile | null) => void,
  onError: () => void,
) {
  return onSnapshot(
    profileRef(uid),
    (snap) =>
      onChange(snap.exists() ? (snap.data() as EmergencyProfile) : null),
    () => onError(),
  );
}

/**
 * Replaces the saved profile. Pass the existing consent timestamp to keep it,
 * or undefined to record consent now (first save).
 */
export function saveEmergencyProfile(
  uid: string,
  data: Omit<EmergencyProfile, "consentAcceptedAt" | "updatedAt">,
  existingConsent?: Timestamp,
) {
  const consent: Timestamp | FieldValue =
    existingConsent ?? serverTimestamp();
  return setDoc(profileRef(uid), {
    ...data,
    consentAcceptedAt: consent,
    updatedAt: serverTimestamp(),
  });
}

export function deleteEmergencyProfile(uid: string) {
  return deleteDoc(profileRef(uid));
}
