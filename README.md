# Cape Safe

A mobile safety app for tourists travelling in South Africa (Cape Town, v1).

Cape Safe helps a visitor see where they are and what is around them, get help in one tap, and stay informed about local safety. It is built for the ITMDA3-34 group project.

> **Disclaimer:** Cape Safe does not replace emergency services. In an emergency always call 10111 (SAPS), 10177 (ambulance) or 112 (mobile emergency).

## v1 features

1. **Map:** your location, police stations, areas to be careful in, and **search with directions** for any place in Cape Town.
2. **SOS:** one-tap calls to South African emergency numbers and sharing your location with your emergency contacts.
3. **Profile:** sign in, save emergency contacts, home country and medical notes.
4. **Tips and alerts:** Cape Town safety tips and current alerts.
5. **Settings:** account, notification, location and accessibility preferences.

Out of scope for v1: iOS release, push notifications, background live-location tracking, other cities, translations and an admin dashboard.

## Tech stack

| Area | Choice |
| --- | --- |
| App | React Native with TypeScript, built with Expo (SDK 57) |
| Navigation | Expo Router (file-based routing) |
| Maps | `expo-maps` with the Google Maps API on Android, `expo-location` for position |
| Backend (planned) | Firebase Authentication and Firestore |
| Builds | EAS (Expo Application Services) development builds |

## Project structure

```
src/
  app/          Routes. Every file here is a screen. Keep these files tiny.
  components/   Shared UI (themed text and view, tab bar, and so on)
  constants/    Theme tokens (colors, spacing, fonts)
  features/     One folder per feature: auth, emergency, map, settings
  hooks/        Shared hooks (for example useTheme)
  services/     External services (Firebase)
  types/        Shared TypeScript types
assets/         Images and icons
```

Route files only import a screen from `src/features/<feature>/`. For example, `src/app/settings.tsx` re-exports `SettingsScreen`.

## Getting started

### Prerequisites

- Node.js (LTS) and npm
- An Android phone or emulator for the full app
- A Google Maps API key (ask the tech lead, and never commit it)

### Setup

```bash
git clone https://github.com/Cape-Safe/cape-safe.git
cd cape-safe
npm install
```

Create a file named `.env.local` in the project root:

```
GOOGLE_MAPS_API_KEY=your_key_here
```

`.env.local` is ignored by git.

### Map search and directions (Google APIs)

Search and directions call Google's REST APIs directly. Add these to `.env.local`:

```
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_key_here
# Optional: lets a key restricted to the Android app work for these REST calls
EXPO_PUBLIC_ANDROID_CERT_SHA1=AA:BB:CC:...
```

In Google Cloud, enable **Places API (New)** and **Routes API** on the project. `EXPO_PUBLIC_` values are bundled into the app, so use a key that is restricted to those two APIs and to the app (Android package and SHA-1), and set a billing budget alert. Without the key the search bar shows "Search isn't set up on this build" and everything else keeps working. Recent searches (last 5) are stored on the device only.

### Run the app

```bash
npx expo start
```

The app uses `expo-maps` and `expo-location`, which Expo Go does not include. To run the full app on a phone, install the **development build** (APK) that the tech lead shares, then start the dev server and open it from that build.

To preview screens quickly without the build, run the web version:

```bash
npx expo start --web
```

The map is not available on web, but the other screens render, for example the Settings screen at `/settings`.

### Useful commands

```bash
npx expo lint        # lint
npm test             # unit tests (Jest)
npx tsc --noEmit     # typecheck
npx expo-doctor      # diagnose dependency and config issues
```

Run lint and typecheck before opening a pull request.

## Team workflow

- Never push directly to `main`.
- Create a branch named `feature/<short-name>` (for example `feature/settings-screen`), push it, and open a pull request into `dev`.
- At least one teammate reviews each pull request before it is merged.
- Install packages with `npx expo install <package>` so versions match the Expo SDK.
- Adding a package with native code needs approval from the tech lead, because everyone must reinstall the development build.
- Keep API keys and Firebase config in `.env.local`. Never commit secrets.

## Roadmap

The full v1 plan (scope, data model, weekly tasks and risks) is in `docs/ROADMAP.md` on the `feature/scaffold-expo-app` branch.

## License

MIT. See [LICENSE](LICENSE).
