import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name!,
  slug: config.slug!,
  android: {
    ...config.android,
    package: "com.yourname.capesafe",
    config: { googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY } },
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      "expo-maps",
      {
        requestLocationPermission: true,
        locationPermission: "Allow $(PRODUCT_NAME) to use your location",
      },
    ],
  ],
});
