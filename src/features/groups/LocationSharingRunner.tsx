import { useLocationSharing } from "@/hooks/use-location-sharing";
import { useMyProfile } from "@/hooks/use-my-profile";

export function LocationSharingRunner() {
  const { profile, groupCode } = useMyProfile();
  useLocationSharing(
    groupCode,
    profile?.locationSharing ?? false,
    profile?.displayName ?? "Group member",
  );
  return null;
}
