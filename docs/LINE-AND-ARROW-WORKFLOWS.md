# Line, arrow and basic-shape workflows

Source implementation after the vector workflows, without a new release package or version. Implementation validation does not establish exact Figma reference parity.

## Controls and behavior

A selected straight line or arrow has a **Line and arrow** inspector:

- **Line length** and **Line angle** measure the actual canvas-space segment, including its own rotation/reflection/scale and every ancestor transform. Changes keep the start endpoint fixed.
- **Line start/end X/Y** place either endpoint in canvas coordinates. The line's own linear transform is retained while its position, bounds and explicit points are rebased; ancestor transforms remain unchanged. Singular transforms and oversized/nonfinite input are refused before mutation. An endpoint-positioned horizontal or vertical line can later expand a collapsed axis through ordinary width/height controls.
- **Arrowhead at start/end** independently offers None, Open arrow, Triangle, Diamond, Circle and Bar. Ordinary lines default to no heads; legacy arrows retain their existing 12-unit open end head.
- **Arrowhead size** sets a shared 1–1,000-unit head size before node/ancestor transforms. Each visible stroke renders its own heads using its paint, weight and opacity. Open/bar heads inherit stroke cap/join. Filled heads use the stroke paint. Stroke opacity is applied once to the combined body and heads so overlapping geometry stays at the chosen alpha.
- Arrowed stroke definitions and head paths share layer coordinates, preserving the color position of gradient and image paints. The shared renderer is used by the editor, prototype, masks and SVG/raster exports.
- Export bounds include transformed heads and their painted stroke extents. Existing clip ancestors still constrain the export. This is conservative bounding geometry, rather than a pixel-tight crop.
- Converting an arrow to an editable vector retains its head settings. For an open multi-contour path with head metadata, heads attach to the first open contour. General vector networks and per-contour head overrides are not implemented.

Endpoint geometry edits require an unlocked layer outside managed instance children with Motion closed. Arrowhead style edits can be tracked as component overrides. Controls also reject stale targets and edits that component/layout/workspace derivation would overwrite. Edits have normal Undo/Redo, recovery and .oui persistence.

Polygon/star **Shape geometry** now exposes a corner radius. The existing radius remains parametric: point count and star inner ratio stay editable. Circular cubic fillets handle convex and concave vertices, clamped to half the neighboring edges. Zero radius keeps the original path. This does not implement Figma corner-smoothing controls.

## Compatibility and interchange

`arrowStart`, `arrowEnd` and `arrowSize` are optional additive fields. The normal parser and store-edit validator reject invalid values before document mutation; both supported .oui versions remain readable. Explicit line points now share path-basis resizing across geometry, rendered SVG, inspector resizing, canvas resizing and layout sizing.

The editable Figma Bridge preserves explicit directed line path data and uniform nonzero/even-odd winding. It preflights new metadata before creating Figma pages and explicitly reports unsupported arrowhead appearance. Mixed per-path winding rules still require review. Appearance-preserving SVG/PNG export includes the heads. API mock checks are not a real Figma desktop round trip.

## Register recommendations

Implementation complete, reference verification pending:

- UI-11-013 Line angle
- UI-11-014 Line endpoint positioning
- UI-11-016 Arrowhead at start
- UI-11-017 Arrowhead at end
- UI-11-018 Arrowhead style
- UI-11-021 Polygon corner radius
- UI-11-025 Star corner radius
- UI-18-022 Arrowhead size
- UI-18-023 Arrowhead color inheritance

Line length was already registered; its canvas-space control is improved here. Do not count it as another new feature. Image strokes retain their separate partial status, and the renderer improvements do not finish general vector networks, stroke outlines or corner smoothing.

## Validation

- Full core suite: 775 tests in 72 files. New cases verify affine endpoints/length/angle, collapsed axes, resizing geometry matching displayed endpoints, invalid/collapsed input, transformed head bounds, default preservation, vector conversion, metadata validation/Undo/version compatibility, polygon/star curves, and Bridge preflight/omission/winding contracts.
- Production browser: six new cases cover transformed endpoint editing, Undo/Redo, recovery and save/reopen, locks, every head style, actual exported solid/gradient/image head pixels, inherited opacity without overlap darkening, and parametric rounded polygon/star SVG geometry.
- Fourteen vector and thirteen existing paint/mask production interactions passed during shared-renderer regression checks.
- TypeScript and production Vite compilation, MCP type checks and 40 MCP tests passed. No installer, native package, website artifact, version change or signing/notarization task belongs to this source batch.
