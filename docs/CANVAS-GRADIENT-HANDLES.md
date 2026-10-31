# Canvas gradient handles

Select one layer in Design mode, expand a gradient fill or stroke, and choose **Edit gradient on canvas**. The existing inspector still owns stop creation, color/alpha, ordering/reversal and fill-stack edits.

## Working behavior

- Linear start/end handles move freely, changing position and length. The small midpoint handle translates the line without changing length. Stop handles sit 14 screen pixels beside the axis and drag along the displayed world axis; perpendicular movement does not change their position even on non-square or affine-transformed layers.
- Radial handles move the center and change the shared normalized radius. A radial circle becomes an ellipse under the layer's non-square paint box and ancestor transforms, matching the existing SVG renderer. Stop positions follow its center-to-radius axis.
- Handles are keyboard focusable: Tab chooses; arrows move a geometric handle by one layer pixel (Shift: ten), or a stop/radius by one percentage point (Shift: ten). Enter/Escape or clicking outside exits. Right clicks never start a gesture.
- Pointer drafts render the selected fill in the complete current canvas scene, including sibling masks, the layer's own mask-source role, clips and ancestor transforms. Drafts do not modify document state, Undo, saves or exports. Linked component copies update on release, as the active help explicitly states; their draft preview remains unchanged.
- Release applies one guarded Undo step, preserving stop IDs/colors/alpha, fill order, unrelated paints and layer geometry. Undo/Redo and `.oui` save/reopen preserve the committed coordinates. Existing linked paint/variable bindings are materialized only for a real change; clamped no-op edits retain bindings and history.
- Escape, pointer cancellation/capture loss, window blur/resize/visibility, camera, page/selection/source, tool/mode/Motion, UI-scale and incompatible canvas modes discard gestures. Current active-session identity is checked at pointer start/move/release, including a retained handler invoked after a synchronous mask reset. Crop has the same narrow retained-session protection. Crop, gradient, mask preview/outlines and vector bend modes exclude one another.

## Additive paint coordinates

`Paint.linearStart` and `Paint.linearEnd` are an optional **pair** of normalized `{x,y}` points. Each coordinate is finite within ±10; normalized endpoint distance is at least `0.0001`. This is additive to `.oui` versions 1 and 2; no format bump or migration is required. Old angle-only paints retain precisely their previous centered coordinates. Shared paint validators cover files, styles, clipboard and source MCP edits; ordinary editor mutation metadata also checks these new fields before accepting a document.

Canvas, SVG/raster exports and inspector swatches use the same SVG definition. Custom geometry is not approximated as an angle-only CSS background: the developer inspector omits that fill and explains using SVG export. The angle inspector rotates custom endpoints about their midpoint while retaining length; **Center gradient line** explicitly removes custom endpoints and restores the legacy centered line. Fill matching compares actual endpoints.

## Supported ownership and limits

Handles work on fills and strokes of every drawn layer, including paths, partial arcs and text. A paint maps to the drawn element's bounds, so handles read that element's own box from the canvas rather than the layer box. On a path that fills part of its layer, or text narrower than its box, handles sit on the shape. Strokes drawn in layer space, which means independent edges and arrowheads, use the layer box. Own and nested rotations, signed reflections and nonuniform affine scale work through the existing world matrix.

Locks, hidden ancestry, instance roots and generated children, and live boolean ancestors are refused before mutation, because those layers do not own what is painted. Video layers and non-design workspaces are excluded. A shape with no area has no paint box and is refused with that reason.

Layer dimensions are bounded at one million, normalized linear coordinates at ±10 and resulting world handles at one billion. Collapsed displayed axes are refused. Radial centers stay within −100…200% and radius within 1…200%, matching existing numeric controls. The radius control is the existing normalized radial model, not independently rotated/skewed radial ellipse handles. Endpoint separation at the lower bound holds the last valid draft. Tiny or degenerate layer transforms cannot be edited.

There is no claim of full Figma gradient-editor parity, native VoiceOver acceptance or native desktop interchange fidelity.

## Transfer and verification

The standalone Bridge validates the optional pair before page mutation, including paint styles. Linear export writes a normalized `gradientTransform` mapping the two endpoints to canonical `(0, .5)` and `(1, .5)`; stop output is sorted by position. Bridge readback preserves compatible orthogonal/equal-scale transforms. Singular/skewed/unsupported-scale or out-of-bounds transforms fall back to the old bounded angle representation and report that handle geometry was approximated. Mock tests independently map nontrivial off-center endpoints through the matrix and back; these are **not a live Figma plugin round trip**. Figma describes paint transforms in the [Plugin Paint API](https://developers.figma.com/docs/plugins/api/Paint/) and normalized endpoint handles in its [REST property types](https://developers.figma.com/docs/rest-api/file-property-types/).

SVG export retains the coordinates. The existing editable SVG importer still accepts only its supported centered unit-length linear geometry; off-center/non-unit SVG gradients may use its explicit visual fallback rather than return as editable gradients. `.oui` is the editable round trip for all new coordinates.

Core tests cover affine geometry, world-axis projection, validation before node/style/clipboard/MCP mutation, legacy defaults, source component synchronization, Undo/Redo, no-op binding preservation, bounded geometry and stale contexts. Actual Chromium interaction tests cover canvas pixels during drafts and after release, mask sources/targets, saved-draft exclusion, keyboard controls, component draft disclosure, cancellation, retained DOM handlers and save/reopen. Native Figma/macOS codec/AT checks were not part of this source-only pass.

## Diamond and angular fills

Diamond fills use the same center handle, and their size handle sets radius and rotation together, shown with a diamond outline. Angular fills have no length, so their rotation handle and stops sit on a fixed ring at half the box size, and dragging a stop moves it around that ring. Arrow keys on the rotation handle turn an angular fill by a degree, or ten with Shift. Handle edits share the same draft, cancellation, Undo and save path as linear and radial fills. On a non-square box the ring is an ellipse. Stroke paints and arbitrary paint boxes remain excluded. Validation: `tests/canvas-gradient-conic.test.ts`, `tests/e2e/canvas-gradient-conic.spec.ts`.
