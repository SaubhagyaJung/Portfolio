# The Gallery — audit and design plan

## Audit before implementation

The complete application is a 4,324-line static index.html (approximately 125 KB), with inline CSS and one inline script. No React, router, package manager, CMS, reusable component modules, backend, models, or existing build step. The checkout is an extracted folder, without Git history. The supplied attachment is the implementation brief, not the source. A pristine HTML copy was saved outside the project before editing.

Routes are in-page #hero, #about, #work, #creative and #contact links. GitHub Pages deploys the repository root on pushes to main. A real gallery/index.html will support direct /gallery/ visits and nested GitHub project paths without SPA rewrites. The custom-domain live site could not be fetched by the research browser, so the supplied local version is authoritative.

Visual identity: #FAFAF7 paper, #0D0D0D ink, Playfair Display serif, Space Grotesk body; Poppins and Inter in supporting/late footer styles. Fixed shrinking logo, magnetic pill navigation, 250vh sticky expanding portrait on desktop, stacked mobile layout, accordion project films, scattered Creative Vision image deck, monochrome footer, optional spray canvas. CSS contains several legacy/overridden footer and project selectors; avoid refactoring unrelated styles. Breakpoints include 1024, 900, 768, 540, 480. No GSAP or external animation dependency: CSS keyframes/transitions, requestAnimationFrame cursor/parallax, IntersectionObserver reveals, scroll handling, custom scattered-card transition.

Content source: four .accordion-slice entries: Satwa Homes (Web Application, new/satwa.mov), JKB Nepal (Full-Stack, new/jkb.mov), Creative Portfolio (Portfolio, new/port.mov), Dashboard (Dashboard, new/watch.mov). No project years, individual descriptions, external project URLs, or case studies. Creative Vision has 11 cards / 10 unique images: Feel Like.png, 2081 Poster.png, sisan.webp, elements.webp, sacar.webp (repeated with two categories), John chamling-2.PNG, rabindra.webp, jojo.webp, paras.webp, uniq.webp. Creative title/caption elements are blank. Preserve original image proportions and derive provisional display labels from filenames; document these as asset labels, not approved artwork titles. Retain both source categories for the duplicate. Do not present unused assets as additional portfolio work. No experimental-room content is identified, so omit a fabricated exhibition.

Assets: assets/ totals about 10 MB; hero.PNG is 2.3 MB. Four MOV films total about 260 MB (31–93 MB each). No architectural models/materials. Generate optimized real film stills, 1024px WebP art copies and on-demand H.264 MP4 derivatives for compatibility. Original media stays untouched. Existing video IntersectionObserver targets .work-video, which does not match actual accordion videos; all four originally autoplay. Original modal lacks dialog semantics/focus trapping; creative alt labels are generic; reduced-motion handling is absent; LinkedIn is labelled WhatsApp. These are pre-existing issues, recorded rather than unrelated redesign targets.

Integration risks: globally scoped styles and keyboard handlers, custom cursor, static relative paths, large autoplay films, no existing data layer. Isolate the gallery in a separate document, with its own styles, events and lifecycle. Add one navigation link using existing styles; tiny enhancement remembers scroll position and animates navigation. No Three.js code/assets on the conventional page. Extract content from existing HTML at build time instead of maintaining duplicate project content.

## Architectural research and interpretation

Sources consulted before design:
- Patan Museum restoration, palace building: https://www.asianart.com/patan-museum/report/page3.html
- Kathmandu Valley Preservation Trust, Architectural Galleries: https://www.kvptnepal.org/project/architectural-galleries
- Patan Museum architecture gallery publication: https://www.patanmuseum.gov.np/downloadfile/mcsc_1397894147_1584089641.pdf

The museum restoration account describes arcades on three courtyard sides, paired carved timber pillars, and balconies beneath the eaves. Interpret that vocabulary through original courtyard proportions, recessed geometric timber screens, masonry piers, continuous shaded verandas and low eaves. No shrines, sacred figures, religious motifs or replica buildings. Geometric screen detailing is a contemporary interpretation, not a claim to reproduce traditional artisan carving.

## Plan agreed by implementation brief

Journey: south threshold → central court → west development gallery → east creative gallery → return to threshold/Exit Gallery. A north gallery wall links the wings and carries a small typographic orientation panel. Court approximately 12 × 12 m, surrounding structure 23 × 23 m, ground exhibition height about 3.7 m; ornamental upper facade and pitched eaves give enclosure. Openings, thresholds and continuous floors avoid inaccessible stairs. Eye height 1.65 m. The courtyard stays largely empty, with one planted corner and a timber bench.

Interaction: WASD/arrows move with acceleration, drag mouse to look (optional pointer lock), Q/E turn for keyboard-only navigation. Raycast click/tap or Enter inspect a nearby work; occlusion prevents selection through walls. Smooth focus remains on the visitor side of the wall; ESC restores prior pose. An HTML Works index gives all works to keyboard/screen-reader users. Native dialog handles inspection focus and media playback. Mobile uses a left thumb joystick and independent touch drag to look. Controls are quiet typographic utility controls. Motion preferences disable camera transitions.

Technical structure: plain ES modules for architecture, materials, artwork, controller, collision, scene, UI and lifecycle. Three.js is the only production dependency. esbuild bundles a separately imported gallery module. Build-time content extraction emits both a manifest and meaningful static catalogue HTML, allowing operation without JS/WebGL and independent metadata. No remote model or CDN runtime dependencies.

Art direction: varied brick courses, rough warm plaster in rooms, stone paving joints, dark timber grain, deep layered geometric lattice windows, stone column bases, brackets and timber lintels, restrained hipped/pitched eaves, deliberate artwork spacing and physical frame depth. Sun with one static shadow map plus hemisphere fill and restrained warm area fill; no bloom/particles/music.

Performance strategy: geometry grouped/instanced by material, cached textures, capped DPR (1–1.5), smaller mobile shadow map, adaptive DPR when sustained frame time is poor, and fallback for sustained unusable performance. Render only while visible and active; dispose on departure/context loss. No film request until Play film. Texture dimensions capped. Profile actual frame intervals/draw calls, disclose that desktop browser checks cannot prove real-device mobile frame rates.

QA: compare original HTML excluding the explicit navigation integration; verify production output/static paths, source asset integrity and content extraction; meaningful collision/reachability tests; run local browser checks for loading, walkthrough, inspection/ESC, video playback, catalogue, exit, no console errors, and viewport matrix (1920×1080, 1440×900, 1366×768, 1512×982, 768×1024, 390×844, 360×800 and short landscape). Record measurements and limitations in QA report. Do not deploy publicly without a deployment request.
