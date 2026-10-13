import { router } from "expo-router";

import LegalScreen from "@/features/settings/LegalScreen";
import { TERMS_OF_USE } from "@/features/settings/legalContent";

export default function TermsOfUse() {
  return <LegalScreen document={TERMS_OF_USE} onBack={() => router.back()} />;
}
