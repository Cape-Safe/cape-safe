import { router } from "expo-router";

import LegalScreen from "@/features/settings/LegalScreen";
import { PRIVACY_POLICY } from "@/features/settings/legalContent";

export default function PrivacyPolicy() {
  return <LegalScreen document={PRIVACY_POLICY} onBack={() => router.back()} />;
}
