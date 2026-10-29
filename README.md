# Oanarina UI Tool

A local-first interface design editor for **Mac**, developed by Oana Rinaldi. The first preview has a working vector canvas, pages, layers, a property inspector, drawing tools, text, basic layout and components, local comments, simple prototype navigation, project files and SVG/PNG/JPEG exports.

**Current source: 0.2.0-dev.2; public notarized download: v0.1.0. This is not a complete Figma clone.** The [feature register](docs/FEATURE-REGISTER.md) specifies **1,860 requirements** across 58 categories: 1,830 required baseline behaviors and 30 later improvements. Status is tracked per requirement; advanced Figma parity remains substantial work. Some Mac integration and reliability requirements are our own requirements rather than verified Figma features. The signed-in Figma interface was inspected on October 29, 2026; remaining reference checks are explicit.

The development source adds live booleans, cubic curve editing, richer text layout, paint/stroke/effect stacks, responsive auto layout, live component instances, variants, local variables/styles, IndexedDB recovery and an editable animation timeline. The register currently records **642 implemented, 132 partial and 1,086 planned** requirements. See the [development validation report](docs/VALIDATION-v0.2-systems-motion.md) for evidence and limitations.

## Run

```sh
npm ci --ignore-scripts
npm run dev                  # browser preview at http://127.0.0.1:5173
npm run build:mac            # universal native macOS app in build/
open "build/Oanarina UI Tool.app"
npm test                    # core model + Figma plugin API mock tests
npx playwright install chromium
npm run test:e2e             # real browser interaction tests
```

Node 22.12+ and Xcode Command Line Tools are required to build. The native Mac app requires **macOS 13+**, supports Apple silicon and Intel, and uses AppKit, WKWebView, and a loopback-only resource server. Files stay on the device; downloading additional Google Fonts contacts Google's font service. The editor also runs in a browser. An experimental Electron shell is retained for future Windows work; Windows is not released.

## Fonts

The included catalog snapshot contains **1,959 Google Fonts families**. Search by name, filter category, sort by popularity or alphabetically, preview custom text, and download families on demand. Downloads are cached in IndexedDB. **24 popular families** are bundled for offline use, with their individual OFL license files. The native Mac font picker also lists installed families. Commercial fonts require an appropriate local license and are not redistributed. Text supports synthetic italic; actual italic font assets and importing arbitrary font files remain planned.

## Figma interchange

Use **File → Figma import / export**. The included [Figma Bridge development plugin](figma-plugin/README.md) transfers supported editable frames, shapes, text, fills and raster images through `.oui`. It reports many property reductions. SVG provides visual exchange. **Direct binary `.fig` import/export is not implemented.** API mock tests and a synthetic transfer through the connected Figma Plugin API pass. The real Figma desktop plugin UI and full-fidelity round-trip still require validation. Browser login alone does not install a development plugin.

## Files and implementation

- `.oui`: version-two JSON documents (version-one files migrate on load), including pages, layers, component/variant definitions, local variables/styles, motion tracks, palettes, comments and available font assets on explicit save.
- Recovery, recent files and named versions: transactional IndexedDB, with additive migration from older localStorage copies. Native autosave uses the same recovery database. Save a `.oui` for a durable portable backup.
- `src/`: React/TypeScript editor and pure document model.
- `macos/`: native Mac window, menus, installed-font discovery, atomic file saving and public-resource server. User documents are never served over HTTP.
- `electron/`: experimental alternate desktop shell.
- `public/features.json`: machine-readable feature register.
- `scripts/inventory.mjs`: named requirement definitions and Markdown generation.
- `tests/`: model tests, plugin API mock tests and Playwright interaction checks.

Read [implementation limits](docs/IMPLEMENTATION.md), [Mac packaging](docs/MAC-RELEASE.md), [font licensing](docs/FONTS.md), and the [user guide](docs/USER-GUIDE.md).

Independent implementation; not affiliated with or endorsed by Figma. Original application code is MIT licensed. Bundled fonts retain their own licenses. No proprietary Figma code or branding is bundled.
