import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

import { auth } from "@/services/firebase";

export function ensureSignedIn() {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe();
    if (!user) {
      signInAnonymously(auth).catch((err) =>
        console.warn("Anonymous sign-in failed:", err),
      );
    }
  });
}
