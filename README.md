# Forma by Oanarina

A local-first interface design editor for **Mac**, developed by Oana Rinaldi. Forma includes a vector canvas, pages, layers, editable typography, responsive layout, local components and variables, prototypes, whiteboards, slides, animation, saved project files and local automation. It is free, and the application code is MIT licensed.

**Source includes unreleased changes after 0.2.0-dev.12; notarized Mac preview: 0.2.0-dev.12. This is not a complete Figma clone.** The [feature register](docs/FEATURE-REGISTER.md) specifies **2,022 requirements** across 60 categories: 1,992 required baseline behaviors and 30 later improvements. Status is tracked per requirement; advanced Figma parity remains substantial work. Some Mac integration and reliability requirements are our own requirements rather than verified Figma features. The signed-in Figma interface was inspected on October 29, 2026; remaining reference checks are explicit.

The register currently records **1,314 implemented, 269 partial and 439 planned** requirements. The preceding [unreleased implementation pass](docs/UNRELEASED-IMPLEMENTATION.md) adds image adjustments, vector/arrow controls, color workflows, numeric scrubbing, component metadata, preferences and batch asset delivery, with Undo/persistence and context guards. Downloads stay frozen while implementation continues; automatic source pushes run tests without creating Mac apps or release archives.

The next [source implementation pass](docs/UNRELEASED-LAYOUT-MEDIA-EXPORT.md) adds center drawing/repeat tools, aspect-aware layout, paired padding, wrapping and stacking controls, SVG/visibility/overlap export settings, animated GIF checks and embedded MP4/WebM playback. Downloads remain unchanged; video uses browser codecs and static exports use posters.

The preceding [typography, grids, local assets and export continuation](docs/UNRELEASED-TYPE-GRID-ASSETS.md) adds rich text variants, guarded grid-track ordering, linked asset usage inspection and style-folder navigation. Design PDF and sRGB PNG metadata have working partial implementations with explicit limits.

The preceding [stroke, paragraph, accessibility and inspection continuation](docs/UNRELEASED-EDITOR-WORKFLOWS.md) adds local stroke styles, primary stroke tokens, per-paragraph/list controls, a keyboard document outline/insertion dialog and read-only developer inspection. Native assistive-technology and exact Figma reference checks remain pending; broader list editing and per-entry stroke bindings remain partial.

The preceding [text input, component assets, mask views and pointer continuation](docs/UNRELEASED-INPUT-ASSETS-MASKS.md) adds local component folders and variants, ephemeral mask inspection/previews, fine dragging and rotation feedback, text descriptions and real fixed-pixel leading. Emoji search and colon completion have a bounded starter catalog and remain partial.

The preceding [selection, frame positioning, vector bending and text settings continuation](docs/UNRELEASED-SELECTION-FRAMES-TEXT.md) adds keyboard/intersecting layout-box selection, optional parent hover outlines, guarded frame coordinates and reparent constraint baselines, fixed-anchor segment bending, opt-in smart punctuation, type-settings tabs and solid whole-layer text backgrounds. Downloads remain frozen; exact Figma and native acceptance remain separate.

The preceding [responsive guides, slice exports, direction and vector offsets continuation](docs/UNRELEASED-GUIDES-SLICES-DIRECTION.md) adds durable column/row spans, a dedicated slice manager and crop overlays, RTL paragraph controls and signed vector offsets. Broader bidirectional layout and true square offset joins remain partial. Downloads remain unchanged.

The preceding [layer previews, layout suggestions, wrapping and stroke outlining continuation](docs/UNRELEASED-PREVIEWS-LAYOUT-WRAPPING.md) adds on-demand layer artwork thumbnails, inferred row/stack previews with guarded Apply, and measured Balance/Pretty text wrapping. Solid stroke outlines have editable geometry and appearance previews; broader stroke outlining remains partial. Source tests and reference verification stay separate. Downloads remain frozen.

The preceding [responsive resizing, OpenType comparisons and vector separation continuation](docs/UNRELEASED-RESPONSIVE-OPENTYPE-SEPARATION.md) adds real before/after frame resizing through shared layout, same-font feature comparisons with guarded range Apply, and hole-preserving compound region separation. Broader vector cutting and layer-thumbnail coverage remain partial. Downloads remain frozen; native and exact Figma reference acceptance are pending.

The preceding [canvas cropping, nested frame fitting and hanging quotations continuation](docs/UNRELEASED-CROP-FIT-QUOTATIONS.md) adds image-fill gestures directly on the canvas, explicit descendant bounds for fitting frames, and measured quotation overhang in shared text layout. All three workflows retain documented partial coverage. Downloads remain frozen.

The preceding [gradient handles, selected text colors, vertical trim and nested names continuation](docs/UNRELEASED-GRADIENT-TEXT-NAMES.md) adds real paint handles and shared endpoint geometry, read-only character fill inspection, measured cap-height trimming and bounded nested container labels. Gradient, trim and name coverage retain explicit partial limits. Downloads remain frozen.

The preceding [independent edge strokes, vector cutting and ordered font fallbacks continuation](docs/UNRELEASED-EDGES-CUT-FALLBACK.md) adds square-box edge widths, exact stroke-contour scissors and shared layer/range fallback policies. All three retain explicit partial coverage; downloads remain frozen.

The preceding [surfaces, vectors and Motion continuation](docs/UNRELEASED-SURFACES-VECTORS-MOTION.md) adds smart duplication, custom rotation origins, editable pattern/noise/texture fills, geometric stroke erasing and anchor lasso, simultaneous vector point editing, vector geometry snapping, staged linear/radial copies and shared Motion inspector/timeline workflows. Advanced network, live-repeat and reference coverage remain explicitly partial. Downloads remain frozen.

The preceding [smoothing, width profiles, progressive blur and scrolling continuation](docs/UNRELEASED-SMOOTHING-WIDTH-BLUR-SCROLL.md) adds rounded-box smoothing, editable per-anchor taper profiles, spatially varying blur and affine frame-local Motion scrolling. Each retains explicit partial coverage and reference limits. Downloads remain frozen.

The preceding [brushes, local libraries, fonts, covers and MCP image continuation](docs/UNRELEASED-BRUSHES-LIBRARIES-FONTS-COVERS.md) adds primitive vector brush presets, local published component snapshots and reviewed updates, guarded font actions/loading status, authored-frame file covers and a bounded source MCP PNG importer. Local-only, renderer, file-format and reference limits remain explicit. Downloads remain frozen.

The development source also includes live booleans, cubic curve editing, richer text layout, paint/stroke/effect stacks, responsive auto layout, live component instances, variants, local variables/styles, IndexedDB recovery and an editable animation timeline. See the [navigation/frame validation report](docs/VALIDATION-v0.2-navigation-frames.md), [import validation report](docs/VALIDATION-v0.2-fig-import.md) and [preceding development validation](docs/VALIDATION-v0.2-pages-raster.md) for evidence and limitations.

The dev.12 preview adds [optional canvas scrollbars and a schematic minimap](docs/CANVAS-OVERVIEW.md), [literal text find/replace](docs/TEXT-SEARCH.md), and [frame overflow inspection, prototype starts and saved export profiles](docs/FRAME-DELIVERY.md). Combined validation passes 707 core tests, 293 production browser checks, 40 MCP tests and the universal native build/menu smoke. See the [dev.12 report](docs/VALIDATION-v0.2-overview-text-frames.md). Overflow and advanced export profiles retain documented limits.

Earlier preview additions include [canvas history and selection navigation](docs/CANVAS-NAVIGATION.md) and [frame presets/inspector actions](docs/FRAME-WORKFLOWS.md). Its name toggles and fit-to-content retain documented limits. The universal dev.12 Mac app and installer are Apple-notarized, stapled and Gatekeeper checked. Intel hardware runtime validation remains pending.

The preceding [source continuation](docs/UNRELEASED-IMPORTS-COMPONENTS-STROKES-INSPECTION.md) adds guarded browser imports with progress/cancellation and safe diagnostics, opt-in component property relevance, deterministic dynamic strokes, persistent spacing inspection and higher-contrast selection controls. It follows the [icons, code cards and SVG checkpoint](docs/UNRELEASED-ICONS-CODE-SVG-DIAGNOSTICS.md). Explicit limits remain partial; downloads stay frozen.

The preceding [source continuation](docs/UNRELEASED-TEXT-PATHS-VARIANTS-INSPECTION.md) adds editable text on bounded paths, presented interactive variants, mixed-fill stack editing, read-only Inspect asset downloads and conservative canvas viewport culling. Each workflow retains explicit partial limits, source validation and separate reference acceptance. Downloads stay frozen.

The preceding [source continuation](docs/UNRELEASED-KEYBOARD-NIB-PROFILE.md) adds local keyboard-layout and additional shortcut preferences, fixed-angle calligraphic nibs, local names/avatars and immutable optional named-version author labels. Auto-layout wrapping is now one atomic edit when validation refuses unsupported content. Coverage remains explicitly partial; downloads stay frozen.

The latest [component and library source continuation](docs/UNRELEASED-SLOTS-LIBRARIES-ACTIONS-AGENT-CONTEXT.md) adds bounded component slots, library deprecation and current-file usage, component search in Actions, and read-only saved-file MCP library context. The documented subsets remain partial; downloadable apps and automation archives stay frozen.

## Run

```sh
npm ci --ignore-scripts
npm run mcp:install           # standalone local MCP build dependencies
npm run dev                  # browser preview at http://127.0.0.1:5173
npm run build:mac            # universal native macOS app in build/
open "build/Forma.app"
npm test                    # core model + Figma plugin API mock tests
npx playwright install chromium
npm run test:e2e             # real browser interaction tests
```

Node 22.12+ and Xcode Command Line Tools are required to build. The native Mac app requires **macOS 13+**, supports Apple silicon and Intel, and uses AppKit, WKWebView, and a loopback-only resource server. Files stay on the device; downloading additional Google Fonts contacts Google's font service. The editor also runs in a browser. An experimental Electron shell is retained for future Windows work; Windows is not released.

## Fonts

The included catalog snapshot contains **1,959 Google Fonts families**. Search by name, filter category, sort by popularity or alphabetically, preview custom text, and download families on demand. Downloads are cached in IndexedDB. **24 popular families** are bundled for offline use, with their individual OFL license files. The native Mac font picker also lists installed families. Commercial fonts require an appropriate local license and are not redistributed. True italic faces are bundled for 17 families. Import local TTF/OTF files, filter by language, keep Google Font favorites, audit missing families and replace them across the document. Portable saves embed only needed weight/style/script assets, subject to font embedding permissions and the 50 MB project limit. See [font details](docs/FONTS.md).

## Workspaces and automation

The current source adds [interactive prototypes](docs/PROTOTYPES.md), [rich character formatting](docs/RICH-TEXT.md), layout/ruler guides, object snapping and parsed inspector arithmetic. [Whiteboard](docs/WHITEBOARD.md) has editable notes, connectors, tables, mind maps, ink, local timer/voting and logical object duplication. [Slides](docs/SLIDES.md) has editable templates/themes, notes, presenter/audience views and PNG/ZIP/raster-PDF exports. These are local implementations with documented limits; cloud multiplayer, PowerPoint and broader suite parity remain unfinished.

**Resources → Free local MCP automation** downloads a standalone stdio server. Nine tools inspect and edit one explicitly selected saved `.oui`, with revision checks, validation, atomic writes and in-process undo. Node.js 22+ is required. There is no server fee, account or API key. Native saves share the project lock and detect external disk changes. Live editor synchronization remains unfinished; save first, then close and reopen after automation. AI hosts/models are separate products. See [MCP setup](mcp/README.md).

## Figma interchange

Use **File → Figma import / export**. The included [Figma Bridge development plugin](figma-plugin/README.md) transfers supported editable layers and linked component/instance/variant structures through `.oui`, including dependency definitions for selection exports. It preserves a supported override/property subset; ambiguous or unsupported structures materialize as editable frames with reports. It reports many property reductions. SVG import offers [editable layers with reduction review](docs/SVG-IMPORT.md) or a sanitized visual asset; SVG export provides visual exchange. **[Direct binary `.fig` Design import](docs/FIG-IMPORT.md) supports a documented subset through File → Open project, with an import report and separate .oui save. Binary `.fig` export is not implemented.** Strict API-contract mocks cover the new component paths. Earlier synthetic connected Figma Plugin API fixtures cover shape/text/prototype paths, not the new component behavior. The real Figma desktop plugin UI and full-fidelity round-trip still require validation. Browser login alone does not install a development plugin.

The development editor also includes [alpha/vector/luminance masks](docs/MASKS.md), [layer and keyboard selection](docs/SELECTION.md), and [transformed canvas gestures](docs/CANVAS-TRANSFORMS.md). Mask exports preserve concealment when exporting a selected target. Clipboard duplication, paste and ungroup preserve supported world transforms and remap prototype/component references; genuine skew is rejected atomically.

[Preferences](docs/PREFERENCES.md) persist drawing defaults and navigation settings. [Layer organization](docs/LAYER-TREE.md) supports drag/reparent, filtering and previewed batch renaming. The current source adds parent-axis alignment, continuous rotation handles, per-layer aspect locks, Option center resizing, and a [keyboard action palette](docs/ACTIONS.md) with tools, categories and recent commands.

The current development build also adds [responsive grid tracks and spans](docs/GRID-LAYOUT.md), [local file folders, archive and Trash](docs/LOCAL-FILES.md), and [independent Mac document windows](docs/MAC-WINDOWS.md) with guarded save/close and recovery.

The development source adds [page duplication, ordering, name filtering and keyboard actions](docs/PAGES.md), with guarded deletion and typed reference remapping, [remembered page views](docs/PAGE-VIEWPORTS.md) and [on-demand artwork previews](docs/PAGE-THUMBNAILS.md). Preferences includes [Follow system appearance](docs/PREFERENCES.md#appearance). Native [PNG/TIFF paste](docs/RASTER-CLIPBOARD.md) inserts embedded image layers, including inside an active slide, with size checks, Undo and save. The source also adds native [Copy as PNG](docs/COPY-AS-PNG.md). The free local MCP server also supports the same guarded page duplication, reordering and deletion in atomic saved-file batches.

The current source also adds [guarded moves between pages](docs/MOVE-LAYERS.md), [file descriptions and information](docs/FILE-INFORMATION.md), [collapsible/resizable sidebars](docs/SIDEBAR-LAYOUT.md) and [bundled release notes](docs/RELEASE-NOTES.md). The title now opens [local file actions](docs/DOCUMENT-TITLE-MENU.md); [interface motion](docs/INTERFACE-MOTION.md) follows system preferences with a local override, and the [layer tree identifies mask sources and targets](docs/MASKS.md). Supported moves preserve identity and live links; unsupported contextual cases are refused before editing.

The native app now has [editable Copy/Cut/Paste between Mac windows](docs/NATIVE-CLIPBOARD.md), including validated component/style/variable/font dependencies, source context and one-step Undo. Referenced-main Cut is refused before writing; other transfer limits remain explicit. Deselect layers for [saved page canvas backgrounds](docs/CANVAS-BACKGROUND.md), or expand the inspector’s [color contrast checker](docs/CONTRAST.md) for an explicit color-pair AA/AAA check. This is not an automatic accessibility audit.

## Files and implementation

- `.oui`: version-two JSON documents (version-one files migrate on load), including pages, layers, component/variant definitions, local variables/styles, motion tracks, prototype actions/guides, whiteboard/deck metadata, rich-text ranges, palettes, comments and available font assets on explicit save.
- Recovery, recent files and named versions: transactional IndexedDB, with additive migration from older localStorage copies. Native autosave uses the same recovery database. Save a `.oui` for a durable portable backup.
- `src/`: React/TypeScript editor and pure document model.
- `macos/`: native Mac window, menus, installed-font discovery, atomic file saving and public-resource server. User documents are never served over HTTP.
- `electron/`: experimental alternate desktop shell.
- `public/features.json`: machine-readable feature register.
- `scripts/inventory.mjs`: named requirement definitions and Markdown generation.
- `tests/`: model tests, plugin API mock tests and Playwright interaction checks.

Read [implementation limits](docs/IMPLEMENTATION.md), [Mac packaging](docs/MAC-RELEASE.md), [font licensing](docs/FONTS.md), and the [user guide](docs/USER-GUIDE.md), and [icon source](docs/ICON.md).

Independent implementation; not affiliated with or endorsed by Figma. Original application code is MIT licensed. Bundled fonts retain their own licenses. No proprietary Figma code or branding is bundled.

The preceding [shortcut and developer-resource continuation](docs/UNRELEASED-SHORTCUTS-DEVELOPER-RESOURCES.md) adds searchable shortcut categories and used-keyboard highlights, toolbar keyboard navigation and validated file-local issue/documentation/repository links in Inspect. Source validation and remaining reference/native limits are recorded there.

The preceding [local review, handoff and navigation continuation](docs/UNRELEASED-LOCAL-REVIEW-HANDOFF-NAVIGATION.md) adds ready/completed statuses, historical preview/comparison/duplication and complete Undoable restore, authored local comment threads, private layer annotations and guarded minimap fit/navigation. Broader annotation semantics remain partial; private review metadata stays out of explicit Figma delivery.

The latest [template, large-tree, font-cache and stroke-scaling continuation](docs/UNRELEASED-TEMPLATES-TREE-FONTS-SCALING.md) adds original free templates and private personal starter kits, bounded Layers virtualization and guarded font acquisition/cache controls. Authored fixed stroke widths have a working partial implementation. Downloads remain frozen while source implementation and validation continue.
