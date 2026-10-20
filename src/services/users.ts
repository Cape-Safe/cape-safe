import { doc, onSnapshot, setDoc } from "firebase/firestore";

import { db } from "@/services/firebase";
import type { UserProfile } from "@/types";

/** Live updates of a user's profile; `null` until the doc exists. */
export function subscribeToProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
) {
  return onSnapshot(doc(db, "users", uid), (snap) =>
    onChange(snap.exists() ? (snap.data() as UserProfile) : null),
  );
}

/** Creates or updates fields on the user's own profile. */
export function updateProfile(uid: string, data: Partial<UserProfile>) {
  return setDoc(doc(db, "users", uid), data, { merge: true });