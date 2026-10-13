import { router } from "expo-router";

import SettingsScreen from "@/features/settings/SettingsScreen";

export default function Settings() {
  return (
    <SettingsScreen
      onPrivacyPolicy={() => router.push("/privacy-policy")}
      onTermsOfUse={() => router.push("/terms-of-use")}
    />
  );
}
