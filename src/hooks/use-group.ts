import { useEffect, useState } from "react";

import { subscribeToGroup, subscribeToGroupLocations } from "@/services/groups";
import type { Group, MemberLocation } from "@/types";

// Live group details and shared member locations. Empty when `code` is undefined.
export function useGroup(code: string | undefined) {
  const [group, setGroup] = useState<Group | null>(null);
  const [locations, setLocations] = useState<MemberLocation[]>([]);

  useEffect(() => {
    if (!code) return;
    const stopGroup = subscribeToGroup(code, setGroup);
    const stopLocations = subscribeToGroupLocations(code, setLocations);
    return () => {
      stopGroup();
      stopLocations();
      setGroup(null);
      setLocations([]);
    };
  }, [code]);

  return { group, locations };
}
