import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Palette } from "@/constants/design";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = scheme === "dark" ? Palette.dark : Palette.light;

  return (
    <NativeTabs
      backgroundColor={colors.card}
      indicatorColor={colors.accentSoft}
      labelStyle={{ selected: { color: colors.accent } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map" md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="sos">
        <NativeTabs.Trigger.Label>SOS</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sos" md="sos" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="group">
        <NativeTabs.Trigger.Label>Group</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.3" md="group" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
