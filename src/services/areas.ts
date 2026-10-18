import { collection, getDocs } from "firebase/firestore";

import { db } from "@/services/firebase";
import type { Area } from "@/types";

export async function getAreas(): Promise<Area[]> {
  const snapshot = await getDocs(collection(db, "areas"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Area);
}

export function averageRating(area: Area): number | null {
  return area.reportCount > 0 ? area.ratingTotal / area.reportCount : null;
}
