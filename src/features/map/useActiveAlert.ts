// useActiveAlert.ts
// Loads the active safety alerts from Firestore (services/alerts.ts) and
// returns the most serious one. Returns null while loading, when there are
// no alerts, or when Firestore is not reachable, so the map still works.

import { useEffect, useState } from "react";

import { getActiveAlerts } from "@/services/alerts";
import type { SafetyAlert } from "@/types";

const SEVERITY_ORDER: Record<SafetyAlert["severity"], number> = {
  urgent: 0,
  warning: 1,
  info: 2,
};

export function useActiveAlert(): SafetyAlert | null {
  const [alert, setAlert] = useState<SafetyAlert | null>(null);

  useEffect(() => {
    let cancelled = false;
    getActiveAlerts()
      .then((alerts) => {
        if (cancelled || alerts.length === 0) return;
        const sorted = [...alerts].sort(
          (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
        );
        setAlert(sorted[0]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return alert;
}
