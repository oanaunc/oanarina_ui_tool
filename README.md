# Forma by Oanarina

A local-first interface design editor for **Mac**, developed by Oana Rinaldi. Forma includes a vector canvas, pages, layers, editable typography, responsive layout, local components and variables, prototypes, whiteboards, slides, animation, saved project files and local automation. It is free, and the application code is MIT licensed.

**Current source: 0.2.0-dev.9; released notarized Mac preview: 0.2.0-dev.8. This is not a complete Figma clone.** The [feature register](docs/FEATURE-REGISTER.md) specifies **2,022 requirements** across 60 categories: 1,992 required baseline behaviors and 30 later improvements. Status is tracked per requirement; advanced Figma parity remains substantial work. Some Mac integration and reliability requirements are our own requirements rather than verified Figma features. The signed-in Figma interface was inspected on October 29, 2026; remaining reference checks are explicit.

The development source adds live booleans, cubic curve editing, richer text layout, paint/stroke/effect stacks, responsive auto layout, live component instances, variants, local variables/styles, IndexedDB recovery and an editable animation timeline. The register currently records **1,062 implemented, 168 partial and 792 planned** requirements. See the [development validation report](docs/VALIDATION-v0.2-pages-raster.md) for evidence and limitations.

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

Use **File → Figma import / export**. The included [Figma Bridge development plugin](figma-plugin/README.md) transfers supported editable layers and linked component/instance/variant structures through `.oui`, including dependency definitions for selection exports. It preserves a supported override/property subset; ambiguous or unsupported structures materialize as editable frames with reports. It reports many property reductions. SVG import offers [editable layers with reduction review](docs/SVG-IMPORT.md) or a sanitized visual asset; SVG export provides visual exchange. **Direct binary `.fig` import/export is not implemented.** Strict API-contract mocks cover the new component paths. Earlier synthetic connected Figma Plugin API fixtures cover shape/text/prototype paths, not the new component behavior. The real Figma desktop plugin UI and full-fidelity round-trip still require validation. Browser login alone does not install a development plugin.

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
