# v0.2.0-dev.4 — SVG, masks and selection

This development checkpoint adds editable SVG import with review, alpha/vector/luminance masks, selection and tree navigation, world-coordinate canvas gestures, and transform-preserving clipboard/ungroup. It is not complete Figma parity. The public notarized download remains v0.1.0; this source build uses ad-hoc signing for local validation.

## Checks

- `npm test`: **376 core tests across 32 files passed**.
- Production build: TypeScript and Vite passed. **119 production-browser tests passed in 48.2 seconds**, including SVG import/edit/history/save/export, mask pixel comparisons and selected exports, transformed pointer gestures, Motion base/point edits, stale-gesture rejection, hierarchy/tree keys, and the existing workspace regressions.
- One development-module repository concurrency test passed separately: 25 overlapping version saves keep the final 20 snapshots.
- `npm run mcp:test`: **22 tests passed**, including real SDK stdio discovery/edits, a standalone bundle outside the checkout, mask validation/export, source/instance constraint persistence and undo. `npm run mcp:check` passed.
- `npm run build:mac`: universal **arm64 + x86_64** AppKit/WKWebView build passed. Ad-hoc code-sign strict verification passed.
- Native smoke passed: **2,018 requirements, 1,959 Google font families, 179 installed font families, 151 buttons**, native bridge present. Canvas capture and MP4/WebM recording capability checks returned true; they are not a native encode/playback acceptance test.
- Rebuilt native app opened and was visually inspected; new mask menu entries were accessible. Figma desktop control still failed as described below.
- `git diff --check` passed. The final register has **965 implemented, 159 partial, 894 planned**, across 60 categories (1,988 must requirements plus 30 later improvements).

Production command:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:51987 \
PLAYWRIGHT_SERVER_COMMAND='npm run preview -- --port 51987 --strictPort' \
npx playwright test --grep-invert '@development-module' --output=build/test-production-dev4-final
```

The explicit server command now forbids silently reusing an occupied port. An initial run accidentally reached a separate website server and was stopped; it supplies no editor validation. The first correct editor run found the Option measurement regression (118 passed, one failed); after separating exact measurement hits from hierarchy hover resolution, the full final suite passed. Build notices remain for the runtime public font CSS path and a large main bundle; native/browser font checks passed, while large-document performance remains a separate requirement.

## Practical limits

- SVG editable import reports reductions for unsupported CSS, effects, complex clips/masks, paint and text semantics. Complete=true means no parser-reported reduction, not exact pixel or shaping parity. The separate visual route remains sanitized. No direct binary .fig support.
- Masks preserve source dependencies when exporting selected artwork. Bounds remain conservative and can leave transparent margins. Nested vector composition follows the documented opaque-geometry contract. Mask outlines/tree indicators/hover previews remain planned.
- Gesture and clipboard transforms preserve orthogonal affine matrices, including ancestor rotation/reflection/scaling. Genuine skew is rejected atomically. Group/Scale resizing preserves intrinsic dimensions in the inspector; full normalization and group bounds remain incomplete. Rotated resize snapping is bypassed.
- Selection outlines follow layer bounds. The overlap picker uses SVG hit-testing, which does not imply pixel-perfect alpha picking or every Figma concealment rule. Text matching compares exact mixed-run intervals. Keyboard box selection remains absent.
- Native smoke and universal compilation are separate from exhaustive WKWebView visual, VoiceOver, physical-device and Intel runtime acceptance. Windows remains experimental.
- Figma is listed running, but computer control rejects its real bundle ID, resolves the outer application to its launcher, and times out on the inner desktop bundle. Main desktop inspection remains blocked. Browser and connected-API evidence from earlier checkpoints is retained; no desktop plugin round-trip claim is made.
- Existing prototype, typography, layout, live-collaboration, suite, font-licensing and saved-file MCP limitations remain in [implementation scope](IMPLEMENTATION.md).

See [SVG import](SVG-IMPORT.md), [masks](MASKS.md), [selection](SELECTION.md), [canvas transforms](CANVAS-TRANSFORMS.md) and the [feature register](FEATURE-REGISTER.md).
