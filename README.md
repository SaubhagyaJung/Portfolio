# Saubhagya’s portfolio + The Gallery

The original static portfolio is still `index.html`. The only page changes are a navigation link and a small gallery entry/return transition. The walkable Three.js exhibition is a separate document at `/gallery/`, with an HTML collection at `/gallery/?view=collection`.

## Preview and build

Use Node.js 22 or later:

```sh
npm ci
npm run build
npm run dev
```

Open http://localhost:4174/gallery/ . `npm run build` creates the deployable `dist/` directory. `npm test` verifies content, paths, collisions and exhibit reachability. To serve the production output: `SERVE_DIST=1 npm run dev` (stop an existing server on port 4174 first).

GitHub Pages packages the committed, approved website with `node scripts/stage-site.mjs`, runs the tests, and publishes `dist/`. Deployment does not rebuild the gallery or re-encode media. The supplied `gallery/build/` entry and `gallery/content.json` are committed alongside the source. The gallery's import map loads the pinned Three.js 0.186.0 modules from jsDelivr; the homepage does not load the gallery engine. Directory routes and relative assets also work under a GitHub project subpath. There was no CNAME file in the supplied project or the existing repository; existing custom-domain settings remain a repository setting. Packaging preserves CNAME if one is added later.

## Content and adding work

The homepage remains the source of truth. `scripts/content.mjs` extracts project names/categories/videos and unique Creative Vision images from its actual markup. Rebuilding generates `gallery/content.json` and the static collection in `gallery/index.html` from `gallery/template.html`. Do not edit those generated files manually.

Add real work to the existing project/creative markup, then run `npm run media` and `npm run build`. Media preparation requires FFmpeg with libx264/libwebp support and uses Sharp. It never changes originals. The first six development projects and first twelve creative works have architectural slots; additional works remain in the complete HTML collection until the exhibition is re-curated. Fourteen real works currently occupy the gallery. Change placement rules in `scripts/content.mjs` if curating the room order. Build tests check reachability.

Use `gallery/curation.json` for optional verified metadata, keyed by IDs from the generated manifest, e.g. `satwa-homes`. Supported properties: title, category, description, year, projectUrl. No fabricated year, case study URL, client relationship or individual description has been inserted. Current shared descriptions are the existing section introductions. Creative labels come from asset filenames; the original site has empty creative titles. Sacar occurs twice with different source categories and is exhibited once, retaining both categories. “Feel Like” is a still image even though its source alt label says Video Edit; no corresponding film was supplied.

Requested from the owner for a final curatorial pass: approved creative titles/categories, individual work descriptions, dates, verified project/case-study links, and a film for any still intended as a video exhibit. Original high resolution creative images are linked from the artwork viewer. Nothing is replaced with fabricated artwork.

## Experience and maintenance

WASD/arrows move; Q/E turn; drag mouse/touch to look; click/tap the floor to walk along a clear path; click a nearby work or press Enter to inspect it. A left thumb control appears on coarse-pointer devices. Free look optionally locks the mouse, and Escape releases it. Escape/Close returns from inspection to the prior camera pose. Help and the Works index remain available, with a persistent Exit Gallery link.

Scene responsibilities are split across architecture, materials, artworks, player, collision and experience modules. `bootstrap.js` owns loading, HTML interfaces, dialogs, fallback and lifecycle. CSS is isolated from the original site. Reduced motion skips camera/entry transitions; no audio is used. Native dialogs trap focus. Film downloads start only after Play film. Hidden tabs and catalogue/dialog views stop rendering; stationary scenes render on change. Sustained slow movement lowers resolution, and severe sustained slowdown or context loss switches to the collection. WebGL load failure also exposes all static collection content. Canvas interaction never holds exclusive access to project information.

Architectural textures are deterministic locally generated materials; repeated architecture is merged by material, with one static sunlight shadow map, capped pixel ratio and 1024px artwork textures. No giant architectural model. The woodwork is an original geometric interpretation informed by Kathmandu Valley courtyard architecture, not a replica or a claim to artisan-authentic carved ornament.

See `docs/GALLERY-AUDIT-AND-PLAN.md` for the audit, architectural references and design rationale, and `docs/GALLERY-QA.md` for verification and practical limitations.
