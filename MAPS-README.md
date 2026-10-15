# Cape Safe: map features

Run it
- `npm install`
- `npx expo start -c`, press `s` if it says "development build", then open **Expo Go** and scan the QR code from inside Expo Go.

Where things are
- `src/app/(tabs)/` tab routes: Map (index), Emergency, Reports, Profile. `src/app/login.tsx` is a modal.
- `src/features/map/MapScreen.tsx` the map screen: search, layer toggles, heat-map panel, cards.
- `src/features/map/mapHtml.ts` the Leaflet map that runs inside a WebView (works in Expo Go, no Google key).
- `src/features/map/places.ts` place search (Photon), nearby hospitals and police (Overpass, with Photon fallback), driving distance (OSRM).
- `src/data/crime.ts` REAL heat-map data built from SAPS station crime counts. Rebuild with `scripts/build_crime_data.py`.
- `src/data/mock.ts` sample incidents only (made up).
- `src/utils/risk.ts`, `src/utils/geo.ts` risk by hour, distance helpers.
- `src/ui/` small theme + themed Text/View used by the new screens.
- Emergency, Reports, Profile and Login are mock screens (no backend yet).

Data credit (CC-BY)
South African Police Service. South African Police Service Annual Crime Records 2005-2026 [dataset]. Version 1.5. Pretoria: SAPS [producer], 2026. Cape Town: DataFirst [distributor], 2026. DOI: 10.25828/5MAW-4H90.

Limits to state in your report
- Heat map uses reported crime COUNTS per police station, not rates per resident, so larger precincts score higher.
- Time of day is an estimate from published national or company-wide patterns, not Cape Town data.
- Place search, nearby places and road distance use free public services (Photon, Overpass, OSRM, Esri tiles) with no guarantees.
