import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import { auth } from "@/services/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(!auth.currentUser);

  useEffect(
    () =>
      onAuthStateChanged(auth, (next) => {
        setUser(next);
        setLoading(false);
      }),
    [],
  );

  return { user, loading, isLoggedIn: !!user && !user.isAnonymous };
}
