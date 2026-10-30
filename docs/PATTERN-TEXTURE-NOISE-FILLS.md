# Pattern, noise and texture fills

This source pass adds reachable local workflows for UI-16-024…029. It is an independent implementation; exact Figma/native reference acceptance remains separate. These fills are not shaders.

## Working controls

Choose **Pattern**, **Noise** or **Texture** in any editable fill's type menu. They participate in ordinary fill stacking, per-fill opacity, visibility, duplication, local paint styles, component inheritance/overrides, clipboard and Undo.

Every surface has scale (1…6400%), rotation (−3600…3600°), repeating X/Y offsets (±one million design pixels), opacity and an explicit transform reset. Coordinates are local to the layer and inherit its transforms. Offsets translate the whole repeating lattice before rotation, so the tile wraps across the shape without leaving gaps. This deliberately avoids the legacy image-TILE behavior that shifts an image inside a clipped tile; ordinary image paints are unchanged. Tile periods must remain between 0.25 and 65,536 design pixels.

**Pattern:** choose **Edit pattern source** to edit a staged vector tile. Add rectangles, ellipses and lines; select a primitive by clicking the preview or its list; drag it to move, or edit X/Y, dimensions, rotation, corner radius, stroke width and opacity numerically. Fill/stroke colors and their enabled states are editable. Primitives can be reordered, duplicated and removed. Tile width/height and transparent/solid background are editable. Geometry outside the tile is clipped. The live inspector shows the edited tile and repeated-fill preview. **Apply pattern source** commits one Undo step; Cancel discards the source draft. Source drafts are not document/canvas/export/save metadata. This is a local primitive tile source, not a live link to arbitrary document frames, components, fonts, images or remote libraries.

**Noise:** deterministic seeded grain with editable unsigned 32-bit seed, 16…128 px source tile size, two endpoint colors, monochrome/two-color or independent RGB channels, and 0…100% pixel coverage. New seed increments the stored seed. Scale changes grain size; tile size changes repeat period. Transparent uncovered pixels expose lower fills. The same pure random generator and lossless PNG encoder work in browser and headless code; there is no animation, shader or unbounded random render state.

**Texture:** choose or replace an embedded still PNG/JPEG/WebP. The existing image reader enforces a decoded input limit of 20 MB, 16,384 px per side and 80 million pixels. The original bytes and intrinsic dimensions are kept; scale, rotation, phase offsets, opacity and existing exposure/contrast/saturation/temperature/tint/highlight/shadow controls remain editable. Remote URLs, SVG input and animated GIF textures are refused. Imported `.oui` texture metadata checks MIME/base64/signature/byte/dimension bounds without a headless pixel decoder; damaged raster payloads may still be refused by the browser decoder. Texture import completion rechecks the source context before changing a fill.

## Shared rendering and data

The existing `Paint.type: 'image'` is retained, with additive optional `surface` metadata. No format bump is needed; `.oui` versions 1 and 2 remain readable. Old paints without a surface are untouched and do not acquire defaults on open.

- Pattern source: bounded tile width/height (1…1024), optional solid background and at most 64 identified rectangle/ellipse/line primitives, with finite bounded geometry, colors and opacity.
- Noise source: bounded size, seed, colors, channel mode and coverage.
- Texture source: the discriminator plus the existing embedded image fields.

Common paint scale/angle/offsets own the repeating transform. Surface paints require image TILE mode. Pattern/noise also store an exact generated image snapshot and intrinsic tile dimensions for compatibility and inspection. Shared validation rejects missing/stale procedural snapshots before file/style/node/clipboard mutation; rendering regenerates from validated source rather than trusting snapshot markup. Generated SVG tiles contain only fixed primitive elements and validated numeric/color attributes, with no scripts, text, external resources, arbitrary paths or markup.

Work is bounded before tile generation: at most 4,096 surface paints and 256 distinct surface sources per document, counting node and style fill/stroke stacks. The global generation cache is capped at 32 entries / eight million image characters. Weak source-object memoization retains only canonical generated or byte-identical validated document images; it does not retain dead sources. Noise generation is at most 128×128 pixels per distinct source. Early and post-derivation checks keep component/layout/style processing from introducing invalid sources.

The shared image-paint definition renders the canvas, alpha/luminance masks, SVG/PNG/JPEG/PDF raster artwork, texture adjustments and supported stroke paints. Vector mask mode intentionally follows existing image-fill semantics: it uses the whole painted shape, ignoring image transparency and per-pixel pattern holes. Opacity zero/hidden paints remain absent. Layer/ancestor transforms and clipping apply through the existing scene renderer. Binding a color variable or sampling a Motion fill color converts the primary paint to a solid and clears incompatible surface metadata.

Layer/range selection, page, document, editor mode, Motion, UI visibility, modal and inherited lock guards protect inspector writes. A source Apply retained across a same-event context transition is refused. Texture callbacks after a changed context cannot mutate the document. Pointer cancellation/blur/resize discard a tile drag; Escape cancels a drag or exits the staged editor. Numeric geometry refusals restore the displayed committed value. No-op transform reset retains style links/history.

## Interchange and current limits

`.oui` and design clipboard preserve editable sources. Paint styles and generated component copies carry the full source/snapshot pair; ordinary explicit overrides and reset/Undo apply. SVG contains self-contained tile images and preserves appearance; it does not preserve editable Forma source metadata. Pattern tiles remain SVG images, noise tiles are PNG. Editable SVG import has its existing pattern/image limitations and may use its explicit visual fallback. Older readers can read the unchanged image paint enum and generated snapshots but do not understand authoritative source editing or the corrected phase-offset semantics.

Source MCP node and style operations accept validated procedural metadata and regenerate snapshots atomically before saving. Caller-supplied stale procedural image bytes are replaced by safe generated output, never read or fetched. Source MCP SVG permits these generated procedural surfaces and reports that editability is not transferred. Ordinary images/textures and other existing raster export restrictions still require the editor; no filesystem/asset endpoint or native IPC permission is added.

The standalone Figma Bridge refuses surface metadata before creating pages, with a message to use SVG/PNG export. It does not silently transfer stale snapshots or pretend to preserve editable pattern/noise/texture policy. Direct binary `.fig` feature parity and native Figma round trips remain unverified.

There is no arbitrary source-layer capture, live source linkage, SVG texture upload, seamless edge-matching synthesis, per-axis tile scale, perspective warp, animated texture or GPU/shader implementation in this pass. These limits do not remove the working assignment, scale, rotation, repeat offsets, deterministic noise or embedded texture workflows described above. Native macOS renderer and third-party SVG-viewer acceptance are not established by Chromium source checks.

## Verification

Core checks exercise safe source generation, exact PNG reconstruction/checksums, deterministic seeds and transparency, malformed data, snapshot coherence, work budgets, `.oui` versions 1/2, style/component/clipboard preservation, Undo, matching, variable/Motion conversion and atomic source MCP/Bridge boundaries. Actual Chromium checks cover exported and canvas pixels for repeats/transforms/phase, staged primitive editing/Apply/Cancel/Undo/save/reopen, noise controls, texture upload/adjustments, fill stacking, all mask modes, affine ancestry/clips, stale callbacks, delayed image import, no-op style retention and small scaled inspector layout. Existing paint and canvas crop tests verify unchanged legacy paths. No production/native build, package, bundle, website or download artifact is generated by this source pass.
