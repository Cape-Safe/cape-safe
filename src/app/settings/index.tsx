import { router } from "expo-router";

import SettingsScreen from "@/features/settings/SettingsScreen";

export default function Settings() {
  return (
    <SettingsScreen
      onPrivacyPolicy={() => router.push("/settings/privacy-policy")}
      onTermsOfUse={() => router.push("/settings/terms-of-use")}
    />
  );
}
