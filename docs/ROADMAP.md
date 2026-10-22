# Cape Safe — v1 Roadmap

## 1. What v1 is

A tourist opens Cape Safe and can:

1. **See where they are and what's around them**: police stations, hospitals, and areas to be careful in, on a map.
2. **Get help in one tap**: call SA emergency numbers and share their location with their emergency contacts.
3. **Have a profile**: sign in, save emergency contacts, home country and medical notes.
4. **Stay informed**: read Cape Town safety tips and current alerts.

### Scope

| In v1                                                | Out of v1 (later / stretch)               |
| ---------------------------------------------------- | ----------------------------------------- |
| Android development + preview builds                 | iOS build, App Store / Play Store release |
| Curated Cape Town data in Firestore                  | Google Places API, other cities           |
| Email/password sign-in                               | Social login, phone OTP                   |
| One-tap calls + share location via share sheet / SMS | Background live-location tracking         |
| In-app alerts list (Firestore)                       | Push notifications                        |
| English UI                                           | Translations                              |
| Read-only content edited in Firebase console         | Admin dashboard                           |

**Rule for the team:** anything not in the left column waits until v1 is demo-ready.

---

## 2. Current state (12 Oct 2026)

- ✅ Expo SDK 57 + Expo Router app scaffold, EAS project linked
- ✅ `expo-maps` with Google Maps API key (local `.env.local` + EAS `development` env)
- ✅ Map centers on the user's location (`expo-location`, needs the newest dev build)
- ⬜ Placeholders: `features/auth/LoginScreen.tsx`, `features/emergency/EmergencyScreen.tsx`, `services/firebase.ts`, `types/index.ts`, `navigation/AppNavigator.tsx`
- ⚠️ Branch `feature/scaffold-expo-app` contains the scaffold **and** the maps work. Merge it to `main` before anyone branches off.
- ⚠️ Android package is still `com.yourname.capesafe`. Finalize it in week 1 (Google key restriction must match).

---

## 3. Key technical decisions

| Topic           | Decision                                                                                                        | Why                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Navigation      | Expo Router tabs in `src/app/(tabs)/`: **Map · SOS · Tips · Profile**, plus `src/app/(auth)/` for sign-in       | Already in use; delete `navigation/AppNavigator.tsx` (unused with Expo Router) and the starter `explore.tsx` |
| Screens         | Route files stay tiny and import from `src/features/<feature>/`                                                 | Keeps the existing structure; each team owns a folder                                                        |
| Backend         | **Firebase**: Auth (email/password) + Firestore                                                                 | Free tier, no server to run, team can edit content in the console                                            |
| Firebase SDK    | Firebase **JS SDK** (`firebase` package) with `@react-native-async-storage/async-storage` for login persistence | Fewer native modules than React Native Firebase, so fewer rebuilds                                           |
| Calls / sharing | `Linking.openURL('tel:…')` and React Native `Share` / `sms:` links                                              | Built in, no extra native modules                                                                            |
| Map overlays    | `markers` for places, `circles` for caution zones (`expo-maps`)                                                 | Supported by `expo-maps` on Android                                                                          |
| Testing devices | EAS **development build** APK shared via link                                                                   | Expo Go can't run `expo-maps`/`expo-location`                                                                |

### Native dependencies: batch them in week 1

Every native package needs a ~20 min cloud build, and all 6 people then need to reinstall the APK. Install everything native **once** in week 1:

```bash
npx expo install expo-location @react-native-async-storage/async-storage expo-haptics
npx expo install firebase
```

After that one rebuild, weeks 2–4 should only need JavaScript changes. Any new native package needs the tech lead's approval.

---

## 4. Data model (Firestore)

Content collections are **read-only for the app** and edited by the team in the Firebase console. User data is private to each user.

```
places/{id}         type: "police" | "hospital" | "safe_spot" | "embassy"
                    name, phone, address, hours, coordinates {latitude, longitude}

zones/{id}          name, riskLevel: "caution" | "avoid"
                    center {latitude, longitude}, radiusMeters
                    note, timeOfDay: "any" | "night"

tips/{id}           category: "transport" | "scams" | "beaches" | "hiking" | "general"
                    title, body, order

alerts/{id}         title, body, severity: "info" | "warning" | "urgent"
                    area, createdAt, expiresAt

users/{uid}         displayName, homeCountry, medicalNotes
                    emergencyContacts: [{ name, phone, relation }]
```

**Security rules:** `places`, `zones`, `tips`, `alerts` allow `read` only. `users/{uid}` allows read/write only when `request.auth.uid == uid`.

Shared TypeScript types for all of these live in `src/types/index.ts`.

## 5. Week-by-week plan

### Week 1: Foundations

**Goal:** everyone can run the app with real navigation and Firebase on their phone.

- [ ] (1) Merge scaffold branch to `main`; protect `main` (PR + 1 review)
- [ ] (1) Finalize Android package name; update Google API key restriction
- [ ] (1) Install the native batch (section 3), run **one** dev build, share the APK link
- [ ] (1) Create Firebase project, add config via env vars, set up `src/services/firebase.ts`
- [ ] (1) Tabs shell: Map · SOS · Tips · Profile + `(auth)` group; remove starter screens
- [ ] (1) Theme tokens in `src/constants/theme.ts` (colors, spacing, SOS red)
- [ ] (2–5) Each stream: screen skeleton in their feature folder with placeholder UI
- [ ] (6) Define the Firestore types with the team → `src/types/index.ts`
- [ ] (6) Start the data sheet: ≥ 15 police stations/hospitals and ≥ 8 zones in central Cape Town
- [ ] **All:** get the dev build running on a phone or the Android emulator

### Week 2: Core features (each works on its own)

- [ ] (2) Load `places` from Firestore → markers with type icons; tap marker shows name/phone
- [ ] (2) Load `zones` → caution circles on the map
- [ ] (3) SOS screen: big buttons for **10111** (SAPS), **10177** (ambulance), **112** (mobile emergency); confirm before calling
- [ ] (3) "Share my location" builds a Google Maps link from the current position and opens the share sheet
- [ ] (4) Sign up / sign in / sign out with Firebase Auth, login persists across restarts
- [ ] (4) Profile form saved to `users/{uid}`
- [ ] (5) Tips screen grouped by category from `tips`
- [ ] (5) Alerts screen from `alerts` (hide expired)
- [ ] (6) Enter the data into Firestore; write ≥ 15 tips and 3 sample alerts
- [ ] (1) Firestore security rules; review/merge PRs daily

### Week 3: Integration & polish

- [ ] (3+4) SOS "share location" sends to **saved emergency contacts** from the profile
- [ ] (2) Filter chips on the map (police / hospital / zones); "call" button in marker details
- [ ] (5+2) Urgent alerts show as a banner on the map screen
- [ ] (4) Route guard: signed-out users go to sign in (decide: is the SOS tab available without login? **recommended: yes**)
- [ ] (all) Loading, empty and error states (no internet, location denied, GPS off)
- [ ] (6) Write the test checklist; first full test pass on 2+ devices
- [ ] (1) **Preview build** (`--profile preview`) for testing without the dev server

### Week 4: Test, fix, demo

- [ ] **Feature freeze at the start of week 4.** Bug fixes only.
- [ ] (6) Full test pass; log bugs as GitHub issues; retest fixes
- [ ] (all) Fix bugs by priority: crashes → SOS → map → everything else
- [ ] (1) Final preview build installed on demo phone(s)
- [ ] (6) Demo script: tourist arrives → sees map → checks tips → triggers SOS → shares location
- [ ] (all) Report/presentation: architecture diagram, screenshots, what's next
- [ ] Add an in-app disclaimer: _"Cape Safe does not replace emergency services. Always call 10111 / 112 in an emergency."_

---

## 6. Team workflow

- **Branches:** `feature/<stream>-<short-name>` off `main` → PR → 1 review → merge. No direct pushes to `main`.
- **Before every PR:** `npx tsc --noEmit` and `npx expo lint` pass.
- **Daily:** short async standup (done / doing / blocked) in the team chat.
- **Secrets:** each dev keeps `GOOGLE_MAPS_API_KEY` and Firebase config in `.env.local` (never committed); the tech lead shares them privately.
- **Builds:** only the tech lead runs EAS builds and posts the install link. Rebuild only for native or `app.config.ts` changes.

---

## 7. Risks

| Risk                                  | Impact                                                    | Mitigation                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Native package added mid-project      | Rebuild + everyone reinstalls; EAS free-tier queue delays | Batch natives in week 1; tech lead approves any new one                                              |
| Merge conflicts with 6 people         | Lost time                                                 | Strict folder ownership (section 5); small PRs; merge daily                                          |
| Data entry takes longer than expected | Empty map at demo                                         | Person 6 starts in week 1; minimum target counts set                                                 |
| Location denied / GPS off on demo day | Broken demo                                               | Fallback to Cape Town view (already done); test the denied path                                      |
| Wrong emergency numbers               | Real-world harm                                           | Verify all numbers against official SAPS / Western Cape sources before the demo; show the disclaimer |
| Google Maps billing / key misuse      | Cost                                                      | Key restricted to package + SHA-1 + Maps SDK only; budget alert in Google Cloud                      |

---

## 8. After v1 (if there's time or a next phase)

iOS build · push notifications for urgent alerts · offline cached data · Places API for wider coverage · more cities (Johannesburg, Durban) · translations (German, French, Mandarin) · background live-location sharing.
