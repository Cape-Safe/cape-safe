import { useEffect, useState } from "react";

import { subscribeToDocuments } from "@/services/documents";
import { subscribeToEmergencyProfile } from "@/services/emergencyProfile";
import type { EmergencyProfile, UserDocument } from "@/types";

type State<T> = { uid: string; value: T; error: boolean };

// Live emergency profile for a user. `loading` is true until the first answer.
export function useEmergencyProfile(uid: string | undefined) {
  const [state, setState] = useState<State<EmergencyProfile | null>>();

  useEffect(() => {
    if (!uid) return;
    return subscribeToEmergencyProfile(
      uid,
      (value) => setState({ uid, value, error: false }),
      () => setState({ uid, value: null, error: true }),
    );
  }, [uid]);

  // Ignore data that belongs to a previous user.
  const current = state && state.uid === uid ? state : undefined;
  return {
    profile: current?.value ?? null,
    error: current?.error ?? false,
    loading: !!uid && !current,
  };
}

// Live document list for a user.
export function useDocuments(uid: string | undefined) {
  const [state, setState] = useState<State<UserDocument[]>>();

  useEffect(() => {
    if (!uid) return;
    return subscribeToDocuments(
      uid,
      (value) => setState({ uid, value, error: false }),
      () => setState({ uid, value: [], error: true }),
    );
  }, [uid]);

  const current = state && state.uid === uid ? state : undefined;
  return {
    documents: current?.value ?? [],
    error: current?.error ?? false,
    loading: !!uid && !current,
  };
}
