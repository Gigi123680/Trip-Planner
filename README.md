# Kyushu Trip Planner

A bilingual, map-first travel prototype for reviewing places and accommodation
candidates around Kyushu. Built with React, TypeScript, Vite and MapLibre GL JS.

- **Website:** https://gigi123680.github.io/Trip-Planner/
- **Repository:** https://github.com/Gigi123680/Trip-Planner
- The website is public and read-only. Visitors need only a browser.
- No backend, database, account or running personal PC is required.
- Shared voting and itinerary editing are **not implemented**.

## Clone and run

Install Git and **Node.js 24 with npm** (matching the deployment workflow).
These commands work in Linux, WSL or a Windows terminal:

```sh
git clone https://github.com/Gigi123680/Trip-Planner.git
cd Trip-Planner
npm ci
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173/`. Keep that terminal
running while developing. Saving source files updates the browser automatically.
The development address is local; share the GitHub Pages address with visitors.
For WSL development, keep the checkout in the Linux filesystem and run npm there.
Do not share one `node_modules` directory between Windows and Linux.

Use **npm and package-lock.json** for installs and dependency updates: CI uses
`npm ci`. The repository also contains earlier pnpm files, but they are not used
by the current workflow. Do not switch package managers as part of unrelated work.

### Existing owner's WSL setup

The original checkout is `/home/weiqian/projects/kyushu-map`, with development at
`http://kyushu.localhost:5175/`. Its `dev.sh` reads an ignored `.node-bin` file
containing a machine-specific Node binary directory. That helper is optional and
will not work in a fresh clone without local setup. Prefer the portable npm
commands above; no custom DNS entry is required for `localhost`.

## How the app works

```text
JSON records + regional notes + cached road GeoJSON
                      ↓
          React state, filters and language
                      ↓
      MapLibre map + pins + popups + sidebar
```

`loadPlaces()` is the boundary between stored place data and the UI. It currently
fetches a local JSON file. A future API can replace that loader without making the
UI depend on database details. React manages interface state; MapLibre manages the
map. Marker, popup and SVG overlay objects are created inside React effects and
must be cleaned up when their dependencies change.

Map tiles come from **OpenFreeMap Liberty**, and Google Fonts have system-font
fallbacks. This is not an offline map. Routing is precomputed, not requested from
OSRM as visitors use the site. No geocoder is called by the running frontend.

## File guide

| File or directory | Purpose |
| --- | --- |
| `src/main.tsx` | App state, sidebar/search, map lifecycle, markers/popups, region interactions and overlap spreading. Currently one large component; make focused changes. |
| `src/styles.css` | Existing responsive visual design and interaction states. Later rules override some earlier prototype styles. Inspect the cascade before adding another override. |
| `src/places.ts` | Place types, localized text helper, runtime validation and JSON loading. |
| `src/filters.ts` | Region/type options, place filtering and URL state serialization. |
| `src/trip-overview.ts` | Region-label anchors/offsets, POI categories/icon mapping and bundled road geometry. |
| `src/marker-art.ts` | Locally authored SVG teardrop pin artwork. |
| `src/areas.ts` | Region camera extents, approximate village/street footprints and screen-space overlap detection. |
| `src/region-notes.json` | Bilingual regional notes actually displayed by region tags. |
| `src/i18n.ts` | Interface translations, language type and saved language preference. |
| `src/config.ts` | Map style URLs and initial Kyushu bounds. Only Liberty is exposed in the current UI. |
| `public/data/places.json` | **Runtime place dataset**, fetched by the browser. |
| `data/kyushu-planning.json` | Editable planning master, including richer place records, regional notes and future trip fields. |
| `data/imports/kyushu_places.json` | Original imported export; preserve as an archive, not the runtime source. |
| `data/prototype-places.json` | Historical first-marker data; do not reimport into the current map. |
| `public/routes/driving.geojson` | Saved OSRM road routes and generation/snap metadata; bundled via a raw import. |
| `vite.config.ts` | Relative asset base (`./`) for GitHub Pages subdirectory hosting. |
| `.github/workflows/deploy-pages.yml` | Build and publish automation. |

There is **no automatic synchronization** between the planning master, runtime
places and runtime regional notes. Update the relevant files together. Editing
only the master will not change what visitors see. Do not rerun an old import to
generate the runtime dataset: it can restore removed places or overwrite edits.

## Current content and behavior to preserve

There are **29 places**: Yufuin 5, Beppu/Hiji 8, Kurokawa 13 and Aso 3.
Fukuoka has a region label and route reference, but no saved destinations yet.
Mount Yufu was deliberately removed; Mount Tsurumi is included in Beppu Ropeway.
Fukuoka, Kumamoto and Amakusa still need destination research.

- Search matches Chinese, English and Japanese place names. Region suggestions
  focus a region without creating a destination pin.
- Region and category selections use OR within each group, AND between groups.
  Selecting nothing in a group means no matches. List and map use the same results.
- `q`, `regions`, `types` and `focus` are stored in the URL. Preserve other query
  parameters and keep browser Back/Forward handling. `focus` highlights a region;
  it is distinct from hiding places with a region filter.
- Bold red bilingual region labels are visible at all zoom levels. They sit on
  the region when zoomed out and move aside progressively between zooms 9 and 12.
  Their counters mean visible places / total places in that region.
- Region hover highlights its pins and dims others; click keeps the focus.
  Regional notes stay open while hovered/focused, with a 1.5-second dismissal
  grace period after leaving. **Do not restore stretched regional shaded hulls.**
  Region extents in `areas.ts` are still used to frame the camera.
- Place hover gives a transient preview; click keeps details open. Moving from a
  pin into its popup should not close it. Touch users can tap. Keep one place
  popup at a time and clear obsolete selections when filtering.
- Only Kurokawa village and Yunotsubo street currently have approximate shaded
  exploration footprints. They are not surveyed boundaries, routed walks or
  calculated walking-time areas. Keep that distinction explicit.
- Overlapping pins are detected from their 42×54-pixel screen footprints, including
  connected groups. Up to 12 spread with lines to their real coordinates; larger
  groups zoom first. Never modify stored coordinates to separate overlapping pins.
- The sidebar collapses; on desktop it also resizes. Keep map resizing and mobile
  layout working. The optional list remains useful for selecting obscured pins.

## Visual and writing conventions

Keep the interface quiet and map-focused: warm cream panels, dark green text and
controls, red region names, terracotta POIs and blue accommodation pins. Reuse
existing spacing, rounded panels and typography rather than introducing a second
design system. Preserve visible keyboard focus, readable contrast and map-source
attribution. Keep descriptive content useful to family members, without internal
implementation details in their UI.

Pins are inverted-water-drop SVGs. Accommodations stack above ordinary POIs.
Use the existing category symbols consistently:

| Record | Symbol |
| --- | --- |
| `poi` + `natural_scenery` | Multiple mountain peaks (also lakes, waterfalls, viewpoints, volcanic scenery and scenic ropeways) |
| `poi` + `hot_spring` | Onsen |
| `poi` + `town` | Village/street |
| `poi` + `food_market` | Shop/market |
| `accommodation` | House |

Use Chinese and English names/descriptions, and retain Japanese names for search.
Simplified Chinese is the default; the language choice persists in localStorage.
The text helper falls back to English if Chinese is missing. Add both counterparts
when content is ready; there is no automatic translation service.

Descriptions should explain the attraction, why it is on our shortlist, whether
it is optional, and a rough duration when useful. Separate planning estimates from
verified facts. Mark historical prices as historical and include currency, unit,
meal/tax basis and date if known. Do not imply that a quoted starting price means
availability, a booking, or that all room types have the same facilities.

## Common edits

### Change a description or regional note

1. Find the stable place `id` in `public/data/places.json` and the matching record
   in `data/kyushu-planning.json`; edit the bilingual descriptions in both.
2. For region summaries, update `src/region-notes.json` and the matching region's
   `reviewedSummary` in the planning master. Earlier `notes` retain research context.
3. Preserve sources, uncertainty, optional status and price qualifications.
4. Check the popup and region note in both languages, including scrolling.

### Add a place

Start from a similar existing record so relevant planning fields are retained.
A minimal runtime POI looks like this (illustrative coordinates, not a destination):

```json
{
  "id": "example-aso-viewpoint",
  "category": "poi",
  "poiType": "natural_scenery",
  "regionId": "aso",
  "name": { "zh": "示例展望点", "en": "Example viewpoint" },
  "nameJa": null,
  "coordinates": { "longitude": 131.0, "latitude": 32.9 },
  "description": { "zh": "可选观景点。", "en": "An optional viewpoint." },
  "location": { "precision": "approximate" }
}
```

- IDs must be unique and stable. Use the existing region/category identifiers.
- Coordinates are decimal degrees; GeoJSON arrays use **longitude, latitude**.
  Keep `coordinates` and richer `location.longitude/latitude` fields consistent.
- Record the actual coordinate source, what the point represents (entrance,
  parking, area center, etc.) and approximate precision. Do not silently present a
  mountain or lake center as a navigable entrance.
- Add a matching planning-master record. A new region also needs filter options,
  a label anchor, camera extent and regional notes in their respective files.
- Put original, licensed photos under `public/images/` when photo display is added.
  The current popup does not render the existing `images` arrays. Never copy
  third-party listing photos/reviews merely because their URLs are available.
- Accommodation links already work; arbitrary new metadata fields require UI/type
  changes before they appear. Do not assume adding JSON automatically adds a card.

### Change map interactions or routes

Keep the MapLibre worker import/`setWorkerUrl` setup intact. Remove map listeners,
markers, popups, timers and overlays in effect cleanup. Use DOM `textContent` for
place text; `innerHTML` is reserved for trusted local SVG artwork.

When updating routes, save precomputed road geometry in the existing GeoJSON and
retain provider, generation date, distance/duration and road-snap metadata. The
four current segments are Fukuoka–Yufuin, Yufuin–Beppu, Yufuin–Kurokawa and
Kurokawa–Daikanbo–Kusasenri. These are planning references without live traffic or
closure checks. The Beppu road is drawn once; the return direction may differ.
Keep the light route halo, attribution and route visibility control. Do not add
live public-routing requests on every map movement.

## Check changes before sharing

```sh
npm run build
npm run preview
```

The build runs TypeScript checks and creates `dist/`; open the preview URL printed
by Vite. There is no automated test suite configured. For content-only changes,
check the edited popups and notes. For interaction/layout changes, also check:

- Chinese/English switching, long text and links;
- combined search/filters, zero results, URL reload and region focus;
- hover-to-popup movement, click-to-pin, touch/keyboard access;
- overlapping-pin spreading and collapse after moving/filtering;
- sidebar collapse/resize, narrow screens, road and walk overlays.

Do not commit `node_modules`, `dist`, `.node-bin`, credentials or build caches.
For new assets/fetches use `import.meta.env.BASE_URL` or bundler-managed imports;
root-absolute `/data/...` paths break under `/Trip-Planner/`.

## Commit and deploy

A fresh clone names its remote `origin`; the owner's original checkout names it
`upstream`. Use `git remote -v` to check yours. Work in a small branch and open a
pull request when review is useful:

```sh
git switch -c improve-place-details
# Edit files and verify locally.
git add <changed-files>
git commit -m "Clarify place descriptions"
git push -u origin improve-place-details
```

Publishing happens when changes reach `main` (by merging a PR or an authorized
direct push). It is automatic and public: do not push unfinished or private content
to `main`. No new hosting command is needed for each update.

The workflow installs locked dependencies, runs `npm run build`, uploads `dist`,
then deploys it to the `github-pages` environment. A failed build leaves the
previous deployment live. Check the repository's **Actions** tab if publishing
fails. The workflow also supports **Run workflow** for a manual deployment.
The repository Pages setting must remain **GitHub Actions**.

GitHub Pages serves the generated files over HTTPS; React and MapLibre execute in
the visitor's browser. The repository is source code, not the website URL. Query
filters work on Pages without a server router. Do not introduce history-based
deep paths without planning for Pages' lack of an application fallback.

## Future direction

Keep changes incremental. Potential next steps are local preference voting with
one batch review submission, photos, itinerary/day filters, and later editing with
multiple users. A future REST API and SQLite service may run on a dedicated Linux
machine. Preserve the data-loader boundary and stable IDs so that transition does
not require redesigning the map. Self-hosted map tiles are a later option; plan
tile data, fonts, sprites, storage and updates together. Do not add backend or
authentication dependencies to the current read-only prototype without a concrete
need. External accommodation pages may block embedding, so ordinary links remain
the reliable fallback.
