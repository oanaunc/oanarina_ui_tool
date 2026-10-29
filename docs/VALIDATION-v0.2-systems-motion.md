# v0.2.0-dev.2 systems, recovery and motion validation

Validated on October 29, 2026, on the development Mac. This is a development source checkpoint, not a completed Figma clone or a new notarized release. The public installer remains v0.1.0.

## Scope delivered

- Live local component instances propagate source edits across pages while preserving supported overrides. Main navigation, reset categories, detach, swap, missing-source restoration, metadata, previews, variant axes/defaults/conflicts, and text/boolean property bindings are reachable in the editor. Nested instance-swap and divergent variant migration remain partial.
- Typed color/number/string/boolean variables have collections, modes, inheritance, aliases, cycle validation, scopes, code syntax and property bindings. Local paint/text/effect styles propagate edits. JSON library import remaps identifiers and aliases. Remote publishing and full folder/conflict workflows remain absent.
- Transactional IndexedDB recovery, recents and named versions replace quota-limited document localStorage. Migration preserves legacy backups. An actual embedded PNG exceeding 5.5 MB survives save/reload. Browser eviction, persistent undo and abrupt termination before a pending write remain incomplete.
- The motion timeline provides property tracks, playback/scrubbing, keyframe editing/multiselection/drag/copy/paste/delete, autokey, easing, reusable styles and presets. Sampled artwork stays separate from base project geometry. GIF uses actual sampled frames; video export uses available browser encoders. A graphical easing editor, complete track selection gestures and fullscreen prototype integration remain incomplete.
- Export bounds account for ancestor transforms, reflections, motion scales, clipping, stroke and effect padding. Selected exports include non-painted ancestor wrappers. Complex rotated clipping remains conservative; glyph overflow and complex group/effect bounds need more work.
- The bridge reports materialized variables/styles, missing linkage, motion omissions and vector fitting. Fixed auto-layout dimensions and text auto-height survive the corrected import order.

## Checks

| Check | Result |
| --- | --- |
| `npm test` | 131 tests passed in 12 files |
| `npm run test:e2e` | 27 Chromium interaction tests passed |
| WebM regression repetitions | Three additional encode/decode runs passed after isolating the playback check from the editor's media CSP |
| GIF export | Eight-frame file parsed and decoded in Chromium |
| WebM export | Exported bytes decoded as 100 × 100 video; test retains the artifact in its output directory |
| `npm run build:mac` | TypeScript/Vite and universal arm64 + x86_64 native build passed |
| Native `--smoke-test` | Editor loaded with 149 buttons, 1,860 requirements, 1,959 Google Font families and 179 installed font families |
| Native capability checks | Canvas capture and MP4/WebM MediaRecorder support advertised by WebKit; actual native movie encoding/decoding remains unverified |
| `git diff --check` | Passed |

The browser suite checks live component propagation with retained text overrides, exposed properties, variable modes/library export, linked styles, legacy recovery migration, named-version restore with undo, large embedded-image recovery, autokey/scrubbing/playback, keyframe controls, reusable animation styles, GIF and WebM exports, plus prior drawing/vector/layout/paint/effect/font/prototype workflows.

The native build is locally ad-hoc signed for development. It has not been submitted for a new notarization. Runtime checks were on Apple silicon; Intel compilation is not an Intel runtime test. Vite still reports the existing large-chunk warning and the runtime public font stylesheet notice.

## Connected Figma evidence

A separate synthetic test file exercised the actual bridge conversion functions through the connected Figma Plugin API. Eight editable layers included frames, solid paint, rounded corners, a shadow, two Inter text nodes, an arc, a cubic vector and vertical auto layout with fill sizing. A composition screenshot confirmed text and vector editability; no full-view raster was imported. A subsequent two-layer regression confirmed 300 × 200 fixed frame dimensions and `HEIGHT` text auto-resize with fill width. The exported eight-layer fixture has sanitized synthetic identifiers in `tests/fixtures/bridge-public-api-roundtrip.json` and passes the local `.oui` parser.

The initial connected check exposed fixed frame shrinkage when enabling auto layout and text resizing being reset by later sizing assignments. Both were corrected, with mock regressions added. Vector contour fitting remains an explicit limitation. This evidence covers the connected API, not running the development plugin UI in Figma desktop. Direct binary `.fig` compatibility, arbitrary input fidelity and desktop round-trip acceptance remain unverified.

## Remaining acceptance

The register has **642 implemented, 132 partial and 1,086 planned** requirements out of **1,860**. Reference verification is separate. Full Figma shell/menu/shortcut parity, advanced text/vector/layout work, cloud collaboration and the wider FigJam/Slides/Sites/Buzz/Make/Agents suite remain substantial work. The Windows shell is experimental. Neither this report nor the register represents those apps as fully implemented.
