# v0.2 development checkpoint — 29 October 2026

Source version: **0.2.0-dev.1**. This is an unfinished development checkpoint. The website download remains the separately signed and notarized **v0.1.0** preview. Do not use its notarization result to describe this development build.

## Changes exercised

- Real boolean geometry with editable operands; curve pen, anchors, tangent handles and path operations; configurable polygon/star/ellipse geometry and independent corners.
- Single-style text wrapping, sizing, paragraph spacing/indentation, truncation, decorations, case/list commands and links.
- Multiple fill/stroke stacks, color entry formats, gradient stops, stroke alignment/caps/joins/dashes, compositing and effect stacks.
- Nested SVG rendering composites group opacity once and propagates parent rotation/reflection to artwork. Pointer editing and selection overlays inside transformed containers still need matrix-aware work.
- Responsive stack sizing, constraints, independent padding, row/column gaps, distribution, alignment, min/max allocation and horizontal/vertical wrapping.
- Shared **108-command** registry generates the native menus. Keyboard normalization handles Option-generated symbols and shifted physical keys. Save works with a focused inspector control.
- Version-one `.oui` migration to version two. New optional fields are validated before loading. The bridge accepts both versions and reports known reductions.

## Automated checks

- `npm test`: **70 passing tests** in eight files. Includes analytic boolean areas, curve serialization, document validation/migration, history, hierarchy, text measurement, paint/color conversion, effects, nested layout, fill allocation, constraints, shortcut matching and eleven Figma Plugin API mock contracts.
- `npm run test:e2e`: **15 browser workflows**. Exercises drawing/history/save/reload, text/font selection, comments, feature register, compact viewport, bridge download, vector editing, paint stacks, gradient/image-fill SVG pixels, effect controls/shadow pixels, group compositing/rotation pixels and responsive inspector editing.
- `npm run build`: TypeScript and production bundle.
- `npm run build:mac`: native universal arm64/x86_64 build. Native `--smoke-test` checks production rendering, resource/bridge availability and the font/catalog/register counts on this Apple silicon Mac.
- Native smoke result: 148 buttons, bridge available, 1,860 register entries, 1,959 Google Font families and 179 installed font families; exit code 0.
- In-app browser inspection checks that the new sizing, min/max, fill/stroke and effect controls are reachable. Private Figma reference files are excluded from the repository and screenshots.

The browser tests inspect exported pixel colors for gradients, inner/drop shadows, group alpha and rotated descendants. This provides rendered evidence beyond checking saved JSON. It is not an exhaustive visual comparison against Figma.

## Remaining limits

1. **1,241 planned and 111 partial requirements remain** at this checkpoint; 508 have a narrow implemented path. The full 1,860-item target is not complete. Implemented does not mean all reference, accessibility, performance or platform acceptance tests have passed.
2. Advanced brushes/vector networks, rich text, layout grid tracks/spans, styles, variables, live component propagation/variants, complete prototypes/motion, cloud collaboration and the wider Figma suite remain substantial work.
3. Angular/diamond gradients use a 256×256 raster pattern. Geometry booleans do not implement text outlines, arbitrary group operands or full Figma winding/network semantics. Scale-tool propagation to advanced strokes/corners needs completion.
4. Text is one style per node, with synthetic italic. Real italic font assets, rich ranges, complex-script controls and full list semantics remain incomplete. Some text fill/auto-size combinations need more layout coverage.
5. Layout stabilization is bounded to eight passes. Rotated container editing, all wrap/min/max/text edge cases, aspect ratios, advanced grid alignment and constraints after every possible reparent/auto-size operation are incomplete.
6. Browser recovery still uses quota-limited localStorage. Large image/font projects need explicit `.oui` saves. Full IndexedDB document/history migration remains planned.
7. Export bounds currently use unrotated layer bounds. Outer shadows, strokes and rotated overflow can be cropped on tight exports. Select a larger enclosing frame as a workaround; automatic visual bounds remain unfinished.
8. Figma bridge tests use a mock. **No real Figma desktop round trip has been verified.** Gradients and rotation origins are approximate; mixed stroke geometry, some image transforms, component identity, variables and reactions have losses. Direct binary `.fig` is not supported. SVG imports as a sanitized image asset, not editable paths.
9. Intel is cross-compiled, not runtime-tested. Windows is not shipped. This development app is locally ad-hoc signed; no new signed/notarized installer has been published.

## References used during implementation

- [SVG filter primitives and compositing](https://www.w3.org/TR/filter-effects-1/).
- [Figma Paint API](https://developers.figma.com/docs/plugins/api/Paint/), [Effect API](https://developers.figma.com/docs/plugins/api/Effect/) and [VectorPath API](https://developers.figma.com/docs/plugins/api/VectorPath/).
- [Figma auto-layout guide](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout-in-Figma).

These references inform implementation; they are not certification of compatibility. Requirement reference verification remains separately recorded in the feature register.
