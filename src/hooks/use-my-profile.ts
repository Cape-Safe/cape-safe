import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { subscribeToProfile } from "@/services/users";
import type { UserProfile } from "@/types";

// The signed-in user's uid, live profile, and current group code.
export function useMyProfile() {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid;
  const [snapshot, setSnapshot] = useState<{
    uid: string;
    profile: UserProfile | null;
  }>();

  useEffect(() => {
    if (!uid) return;
    return subscribeToProfile(uid, (profile) => setSnapshot({ uid, profile }));
  }, [uid]);

  // Ignore a profile that belongs to a previous user.
  const profile = snapshot && snapshot.uid === uid ? snapshot.profile : null;
  const loading = authLoading || (!!uid && snapshot?.uid !== uid);

  return { uid, profile, groupCode: profile?.groupIds?.[0], loading };
}
