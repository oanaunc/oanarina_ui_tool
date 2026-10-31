# Per-anchor variable-width strokes

Point widths work natively on open and closed contours, straight or curved. This is Forma's own band geometry and has not been checked against Figma's width tool.

Select a contour path, choose **Edit vector points**, then open **Per-anchor stroke widths**. Set one saved solid or gradient stroke to centered alignment, without dashes, and enable point widths. Choose an anchor and enter its full symmetric width, or enable **Width control handles** and drag either normal handle. Multiple anchors retain independent ratios. Shift-drag a handle to move one side only, or use **Anchor width bias %**. Click the stroke itself to add a width point. Control reduces pointer travel to 10%; widths clamp to the displayed numeric limits. The canvas shows the actual filled band while dragging and commits once on release. The numeric path is keyboard accessible. Escape, Space/navigation, pointer cancellation, window blur, camera/mode/source/selection changes cancel pending work.

Each anchor stores optional `widthScale` relative to the base stroke weight. The stroke opts in with optional `variableWidth: "points"`. Global weight changes scale the profile; zero tip widths and a zero base weight are retained. A zero base weight hides the band and disables handle edits until the base weight becomes positive. A zero-distance click does not rewrite geometry/styles or create Undo history. Disable point widths to return to a uniform stroke; ratios remain saved until a later geometry conversion replaces those anchors.

## Supported geometry and paint

- One saved centered solid or gradient stroke, butt/round/square caps, miter/bevel/round joins, no dashes or independent edge widths; existing fill remains a separate paint.
- One to sixteen contours, open or closed, two or more anchors each, at most 512 total anchors. Reversing corners and duplicate straight anchors refuse.
- Positive node/path coordinate boxes, at most 1,000,000 units per dimension; centerlines within ±995,000 local units.
- Per-anchor ratio 0–64, bias −1 to 1, maximum full local width 10,000. Interactions require a visible, unlocked, detached hierarchy with at most 64 ancestors and finite invertible transforms; UI scale and signed affine ancestry are included in hit testing.
- No arrowheads or direct width/height animation tracks while a profile is active. Transform-scale animation and effects remain available. Profile controls require Motion closed and mask inspection off.

Straight spans are exact tapered quadrilaterals. A curved span is tiled along the cubic with a turn limit of 12 degrees per piece, up to 64 pieces per segment, and each tile's outer side is a quadratic through three true envelope points. Widths interpolate along real length, not curve parameter. Inside a bend tighter than the half width, the radials cross and both lobes are tiled apart. Every piece is wound positively and the whole band is **one nonzero filled path**, so overlaps do not accumulate alpha.

Bevel joins add exact triangles, round joins add the exterior circular sector, and miter joins add the tip up to the stroke's miter limit, then fall back to bevel. Closed contours join every anchor and have no caps. Round caps span the true band when widths are lopsided. Pressure input, brush profiles and editable Figma width-tool interchange remain unimplemented.

## Tapers and width points

**Taper** sets every anchor from a preset: uniform, start, end or both ends, measured along each contour's real length. **Taper amount %** blends toward uniform, **Smooth taper** eases the ramp, and **Keep existing widths** multiplies current ratios instead of replacing them. A both-ends taper on a contour with nothing near its middle adds one anchor at an exact split, so it has somewhere to peak.

**Add width point** splits the segment at a percentage of its real length, or at the clicked location on the stroke. The split is exact de Casteljau subdivision, so the centerline does not move, and the new anchor interpolates width and bias. Width points are anchors: there is no separate width track along the path. Stamped brushes have their own taper, described in [VECTOR-BRUSH-DRAWING.md](VECTOR-BRUSH-DRAWING.md).

## Persistence, layout and interchange

Optional metadata is accepted by existing `.oui` versions 1 and 2 without migration. Older builds refuse a profile on a curved or closed contour, a miter join or a gradient; straight open profiles still open there, and older builds ignore `widthBias`. Import, clipboard and headless MCP transactions validate before mutation; malformed fields, incompatible style/topology changes and invalid batches reject atomically. Local component source changes propagate width metadata to managed copies. Managed copies and inherited locks remain read-only. Geometry-local profiles cannot be captured in or overwritten by a reusable stroke style; disabling the profile permits ordinary style workflows again. Scalar base-weight/color bindings continue through the existing design-system pipeline if the resulting profile is valid.

Ordinary point moves and supported surviving-anchor deletion preserve ratios. Geometry normalization, smoothing, curve conversion, Boolean operations, group flattening, cutting, erasing, outlining, offsetting and region separation refuse active profiles before dropping width metadata. Entering/leaving point editing does not bake an active profile. Width/height auto-layout changes retain the original path basis; maximum profile radius participates in stroke-aware sibling spacing and hug measurement. Layout uses a conservative maximum radius, expanded by √2 for square caps, rather than a paint-tight tapered envelope.

Canvas, SVG, PNG/JPEG/PDF raster consumers and alpha/vector/luminance mask source rendering use the same band geometry. Artwork and mask regions conservatively include off-box profile anchors plus their maximum radius. Padding can exceed the exact painted shape. Frame clipping, explicit layer/frame/slice viewports and export crops intentionally retain their normal crop semantics. Outline view continues to show the centerline. Approximate Dev CSS warns and omits the profile.

Editable Figma Bridge import refuses active profiles **before creating Figma nodes**, with SVG/PNG guidance. Inactive saved ratios are validated and explicitly reported as omitted while transferring the uniform stroke. No binary `.fig` compatibility or real Figma desktop round trip is claimed by API-mock tests.

## Verification

Core checks cover exact band coordinates, profile validation, basis/affine mapping, zero-delta history, Undo/redo, `.oui` 1/2 save parsing, actual component inheritance, closed clipboard transfer, atomic headless MCP edits and SVG outlines, Bridge refusal/omission, style/conversion safety, stroke-aware layout siblings/hug bounds, and a 20,000-layer / 64-ancestor / 512-anchor activation operation-count budget. Browser checks exercise reachable inspector fields and canvas handles, source-preserving preview/release, actual save/reopen, reflected transforms at 125% UI scale, cancellation/context interruptions, inherited locks/nonprimary events, actual exported alpha at joins and affine mask-overhang pixels. Cap/join checks cover exact cap areas, both round turn directions, finite square-cap envelopes, actual round/square exterior pixels with single-alpha overlap, normal controls, Undo and saved profiles.
