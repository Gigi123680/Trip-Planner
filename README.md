# Kyushu map — first increment

React + TypeScript + Vite + MapLibre. A read-only map centred on Kyushu, with two map styles and a reset-view button. Map tiles are currently served by OpenFreeMap; this is not an offline map.

## Develop

Install Node.js LTS, then run `npm install` and `npm run dev` in this directory. Open the printed localhost address. Run `npm run build` to type-check and generate `dist/` for static hosting. `npm run preview` previews that build.

## Decisions

- Develop in Ubuntu WSL at /home/weiqian/projects/kyushu-map; a dedicated Linux machine may host a later backend.
- Use hosted OpenFreeMap for this prototype; prefer self-hosted regional map data later. Tile generation, fonts, sprites, disk requirements and update strategy will be evaluated separately.
- Public sharing is acceptable for now. No authentication in the prototype.
- Add places and details next, followed by itinerary filters and precomputed road routes.
- Future data starts in JSON/local images, behind a small data-access layer. Later options: REST API, SQLite, editing and multiple users.
- Live accommodation embeds depend on the external site's embedding permissions; ordinary listing cards and links remain the fallback.

Map source configuration lives in `src/config.ts`. Styling works with hosted sources too; self-hosting primarily adds control over data and operation. Google Fonts are currently an optional online visual dependency, with system-font fallbacks.

No backend, geocoder or route engine is required for this increment. No deployment has been made. Relative asset paths are configured for GitHub Pages; publishing automation will be added when a repository is selected.

## Current local setup

Run `./dev.sh` in this directory. Open http://kyushu.localhost:5175/ on this Windows computer. The server must remain running. Node is installed under ~/.local/share/kyushu-node; dev.sh adds it to PATH for this project.

Simplified Chinese is the default interface, with a persistent English switch. External listing previews retain their source language. Future place records should support language-keyed titles and descriptions with Chinese-first fallback; map label language is separate from interface language. No machine translation service is connected.

## Places

`public/data/places.json` is the source of place records (schemaVersion 1). `src/places.ts` validates and loads the file, providing a future API replacement boundary. Add `poi` or `accommodation` records with localized names and longitude/latitude; optional descriptions and HTTP(S) source links populate the popup. DOM markers stay visible through base-style changes. No backend is involved.

First POI: Mount Aso (Nakadake), using JMA's published reference coordinates, 32°53′01″N 131°05′49″E. This is a mountain reference, not an access point, car park or precise crater viewing location. Description is explicitly a placeholder.

Marker appearance: teardrop SVG pins with a multi-peak mountain POI icon and a house accommodation icon. The colour Liberty background is the only exposed style; the Quiet selector was removed.

## Yufuin batch

Six Yufuin records are mapped, with source URLs and approximate-location caveats. The original export is unchanged in data/imports. data/kyushu-planning.json preserves all 30 records, regional notes and stays, with six resolved positions; only the resolved Yufuin batch plus the original Aso test marker are published in public/data/places.json. Other regions remain pending. Accommodation identity matched the official site's Airbnb room 41565766; coordinates use its map viewport centre and are explicitly approximate. Icons use locally authored SVG artwork.

## Remaining regions imported

All 30 exported destinations are now mapped: Yufuin 6, Beppu/Hiji 8, Kurokawa 13, Aso 3. Every position has a source URL, approximate precision and point-representation metadata. Sources include MapFan, Yahoo Maps, local tourism authorities, published property map links and Onsenpick's public map dataset (coordinates only; no photos/reviews copied). Original user export is unchanged. Aso prototype marker is preserved in data/prototype-places.json and replaced on the map by the actual crater destination. District centre pins have no implied boundary or calculated walking time.

A bilingual Yufuin town label is positioned near Yufuin Station (33.262617 N, 131.355092 E), west of the main POI cluster. It appears at zooms 6–16, is non-interactive and does not count as a destination. Source: https://en.wikipedia.org/wiki/Yufuin_Station .

## Trip overview and classification

Always-visible bilingual bold red labels mark Fukuoka, Yufuin, Beppu, Kurokawa and Aso. Labels are non-interactive contextual annotations, not additional places. Fukuoka is a city-centre reference from https://facts.city.fukuoka.lg.jp/en/data/position/ . Other anchors use existing sourced place coordinates.

category remains poi/accommodation. Each POI now has one poiType: natural_scenery, hot_spring, town or food_market. Original subcategories are retained. The icon mapping is centralized in src/trip-overview.ts; nature-oriented ropeways, viewpoints, lakes, grasslands and crater scenery use the mountain symbol. Bath facilities use onsen, town/district walks use village, food/shopping/markets use shop, accommodations use house and stack above POIs.

A toggleable GeoJSON overview connects Fukuoka–Yufuin, Yufuin–Beppu (shared outward/return segment), Yufuin–Kurokawa and Kurokawa–Aso. These are straight schematic connections, not road routes. No distance, driving time or route optimization is inferred. The fit-all view includes Fukuoka while the overview is on.

## Road routes replace schematic geometry

The current overview uses actual precomputed OSRM driving geometry from https://router.project-osrm.org, saved in public/routes/driving.geojson. Four separate legs: Fukuoka–Yufuin, Yufuin–Beppu, Yufuin–Kurokawa and Kurokawa–Daikanbo–Kusasenri. The Beppu connection is displayed once for the round trip; reverse-direction road geometry may differ. Endpoints are approximate regional references snapped to roads; snap offsets are recorded. Kusasenri's grassland centre snapped about 405m to its road access. Routes are planning references without live traffic or current closure verification. Distances/durations are stored but not displayed as live estimates. The browser loads bundled geometry, not the public route service. Solid charcoal routes have a light halo, and the expanded legend has larger text and icons.

Region labels use a bottom-centred anchor with a 62px lift through zoom 9. Between zooms 9 and 12 their offsets smoothly interpolate toward side positions. Yufuin and Beppu label anchors use the existing accommodation / Kannawa pin-cluster reference coordinates, so the overview labels stay near those clusters rather than the railway station or distant city centre. Route endpoints are unchanged.

## Filters and sidebar

Top-right search matches Chinese, English and Japanese place names. Region/category multi-select filters use OR within each group and AND across groups; zero selected means no matches. Search and selections round-trip through q/regions/types URL query parameters, with unknown IDs ignored and popstate supported. List/map derive from the same filtered collection, without refetching data. Fit results uses visible POIs only, independent of the road route toggle.

Desktop sidebar collapses and resizes via drag handle (280–520px) or separator arrow keys; mobile uses an overlay drawer. A ResizeObserver keeps the map projection current. The optional list sorts by region and localized name; selection zooms and highlights the pin. Hover preview opens after 180ms, closes 260ms after leaving both pin and popup, and click pins it open. Touch uses tap. Only one popup opens at a time, and filtering clears obsolete selection.

## Region focus, walk highlights, overlapping pins

Region search suggestions (Chinese/English/Japanese aliases) focus and select a region without adding a destination pin. `focus` persists in the URL. Red labels are accessible buttons with visible/total counts: hover previews the region area, click focuses and keeps it highlighted. General areas combine manually chosen geographic envelopes with buffered saved places using a convex hull. Aso uses an approximate ellipse based on GSJ's published 25km N–S / 18km E–W caldera dimensions. These are explicitly approximate planning envelopes, not traced geological/admin boundaries.

Kurokawa village core and Yunotsubo street have hand-curated approximate orientation footprints, citing official maps for context. They are NOT surveyed boundaries, not official landscape-plan areas, not routed walks and have no calculated walking times. Place hover/click shows their footprints; hiding the place hides the footprint.

Popup overlap controls detect connected intersections of 42×54 pixel pin footprints at the current zoom. Up to 12 pins spread around a circle with leaders to their unchanged geographic coordinates; larger groups first zoom closer. Expanded pin popups follow displayed offsets. Map movement/resizing/filter changes collapse the arrangement; list selection stays available.


## GitHub Pages deployment

Repository: https://github.com/Gigi123680/Trip-Planner
Site: https://gigi123680.github.io/Trip-Planner/

The Pages source is GitHub Actions. Every push to `main` installs the locked npm
dependencies, type-checks and builds the app, uploads `dist`, then deploys it to
the `github-pages` environment. A failed build does not replace the deployed site.
The workflow can also be started manually from Actions.

Vite uses a relative base (`./`), so generated assets and JSON loads work under
the repository subdirectory. Pages serves the static frontend over HTTPS; React
and MapLibre run in the visitor's browser. Map tiles still come from OpenFreeMap.
No local PC, WSL process, database or private API is needed for this prototype.
Shared voting is not implemented yet.
