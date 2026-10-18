import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

import { db } from "@/services/firebase";
import type { SafetyAlert } from "@/types";

export async function getActiveAlerts(): Promise<SafetyAlert[]> {
  const now = Timestamp.now();
  const snapshot = await getDocs(
    query(collection(db, "alerts"), where("expiresAt", ">", now)),
  );
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as SafetyAlert)
    .filter((alert) => alert.startsAt.toMillis() <= now.toMillis());
}
