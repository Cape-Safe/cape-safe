import type { MemberLocation } from "@/types";

export const STALE_AFTER_MS = 60 * 60 * 1000;

export function isFresh(location: MemberLocation, now: number) {
  return now - location.updatedAt.toMillis() < STALE_AFTER_MS;
}

export function lastSeenLabel(location: MemberLocation, now: number) {
  const minutes = Math.floor((now - location.updatedAt.toMillis()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} h ago`;
}
