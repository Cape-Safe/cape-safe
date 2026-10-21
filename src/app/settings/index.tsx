import { router } from "expo-router";
import { Alert } from "react-native";

import SettingsScreen from "@/features/settings/SettingsScreen";
import { useAuth } from "@/hooks/use-auth";
import { authErrorMessage, logOut, resetPassword } from "@/services/auth";

export default function Settings() {
  const { user } = useAuth();

  async function changePassword() {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      Alert.alert("Check your inbox", `We sent a reset link to ${user.email}.`);
    } catch (err) {
      Alert.alert("Couldn't send reset email", authErrorMessage(err));
    }
  }

  return (
    <SettingsScreen
      onSignIn={() => router.push("/settings/login")}
      onChangePassword={changePassword}
      onLogOut={() =>
        logOut().catch((err) =>
          Alert.alert("Couldn't log out", authErrorMessage(err)),
        )
      }
      onPrivacyPolicy={() => router.push("/settings/privacy-policy")}
      onTermsOfUse={() => router.push("/settings/terms-of-use")}
    />
  );
}
