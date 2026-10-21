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
    [
      "expo-image-picker",
      {
        cameraPermission:
          "Allow $(PRODUCT_NAME) to use your camera so you can photograph documents for your emergency profile.",
        photosPermission:
          "Allow $(PRODUCT_NAME) to access your photos so you can add documents to your emergency profile.",
      },
    ],
  ],
});
