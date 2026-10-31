# Editable stroke outlines

## Workflow

Select one leaf vector and choose **Vector → Outline vector stroke…**, use action search, or choose the same control while editing its points. The dialog shows original artwork and proposed filled contours as separate local SVG image documents, using the same renderer and shared viewport. Gradient/filter/mask IDs inside those images cannot overwrite live Canvas definitions. Existing ancestor clips and sibling masks are retained in the preview; a selected mask source includes its affected siblings.

**Apply stroke outline** replaces the selected layer's geometry in one undoable transaction. Its ID, name, parent, node opacity and unrelated metadata remain. The visible stroke paint becomes a solid fill and the saved stroke stack becomes empty; the resulting closed contours are editable with the existing point tools. Undo/Redo, `.oui` v1/v2 save/reopen and ordinary SVG/PNG/JPG exports use existing document fields. No migration or new dependency is introduced.

Preview never changes the document, history or saved/exported artwork. Context changes discard it. Apply rechecks the live target, recomputes the geometry, detaches the paint/stroke and changed-geometry style/variable links, then validates that shared component/layout derivation has not overwritten the proposed output. Unsupported or controlled geometry is refused atomically. Unrelated bindings, such as opacity, remain.

## Supported geometry

- Every visible stroke with positive width, in solid, gradient or image paint. Hidden strokes are not outlined.
- Butt, round and square endpoint caps; miter, round and bevel joins; the saved miter limit, including bevel fallback.
- Positive dash arrays, including odd-length repetition and positive/negative dash offset. Dash phase restarts per subpath. Dashes crossing a closed contour seam are joined across that seam instead of receiving two endpoint caps.
- Center alignment; inside/outside alignment for closed contours. Lines/arrow-shaped centerlines with heads disabled retain the renderer's forced-center alignment. Outside geometry also respects the renderer's finite white-mask rectangle.
- Simple open/closed contours, nested winding holes, rectangles, ellipses, polygons, stars and supported compound paths. Paper Boolean union removes overlapping pieces; unresolved crossings/touches are refused.
- One stroke with no fill, or with a fully opaque fill of the same solid color, stays one layer. Anything else becomes a group under the same layer identity, holding the fill as it was and each stroke as its own filled path, in paint order. A mask source stays one layer, so that case is refused.
- Arrowheads join the outline: closed heads as filled shapes, open heads and bars stroked with the same cap and join.

Gradient and image paints stay where they were on the canvas. Linear gradient endpoints, radial and conic centers, image centers and picture size, and tile origins are rewritten for the new box, including under a layer rotation. A radial or image frame on a flipped or unevenly scaled layer cannot be expressed in those fields, so it stays close rather than exact.

Stroke expansion happens in **node-local coordinates before the layer's own affine transform**, matching the SVG renderer. This preserves nonuniform scaling of cap/width geometry. The own rotation/reflection/scale is then baked into parent-space contours; ancestor transforms remain intact. Zero-height horizontal and zero-width vertical line centerlines can become ordinary positive-area outlines.

Curves use the existing bounded adaptive flattening with a **0.25-unit local control-hull deviation tolerance**. Curved outline geometry and dash arclength are approximations, and large inherited scales magnify this tolerance. This does not promise exact analytic parallel curves, exact curved-dash phase or reference-app gesture fidelity. Round geometry is represented with cubic circular arcs.

## Explicit refusals and work limits

Visible effects, zero dash entries, zero-length/degenerate/reversing contours, crossing/touching input geometry and inside/outside open-path clipping remain unsupported. Hidden or inherited-locked targets, managed instance descendants, containers, live booleans, Motion, non-Design mode and Slides cannot start conversion. Component or workspace/layout control that changes the final geometry prevents commit.

The proposal belongs to one document/page/selection, tool, vector target, camera, modal and Home/UI/Motion/mode context. Changed context, window blur or hidden-document visibility expires it. Escape/Cancel closes it without mutation. There is no native filesystem/IPC expansion, external project upload or broad desktop codec/assistive-technology claim.

Bounds: at most 32 source contours, 512 source points, 200,000 path-data characters and 512 flattened points; width at most 10,000; miter limit at most 100; at most 100 positive dash entries, each 0.001…1,000,000, and absolute dash offset at most 1,000,000. Dash splitting stops at 512 steps / 128 runs; Boolean construction at 2,048 pieces; output at 4,096 points / 128 contours. Supported local/projected controls stay within ±1,000,000 and resulting dimensions within document limits. The existing preview limits of 2,000 context layers and 500 affected mask siblings also apply.

## Rectangle dash-continuity repair

The rectangle path generator previously emitted zero-radius SVG `A0` arc commands. Chromium's dashed stroke rendering at these degenerate corner segments differed from the equivalent continuous rectangle geometry used by Paper. The generator now omits **only zero-radius arcs**, using the adjoining straight edges and closure; nonzero corner arcs remain. This preserves the intended rectangle shape and restores continuous dash progression. A pure mixed-corner test and actual transformed closed-dash pixel comparison cover the change.

## Validation

Final source checks: **72 targeted core tests** across outline, offset and geometry, editor TypeScript, and **32 actual Chromium interactions** (19 new outline cases plus 13 offset regressions) pass. Final integrated checks pass **1,277 core tests across 112 files, 668 browser interactions, 54 source MCP checks and editor/MCP TypeScript**; see [the integrated report](UNRELEASED-PREVIEWS-LAYOUT-WRAPPING.md).

Coverage includes cap/join/alignment bounds and area, miter fallback, holes and outside masking, signed/odd dashes and seam merging, own/ancestor affine mapping, bounded curves, supported fill/opacity, refusal/work limits, bindings, one-step Undo/Redo and old/new parse. Browser checks compare real original/result SVG pixels for all three caps/joins/alignments, signed dash phase and a closed dashed path under reflected nonuniform own and ancestor transforms. They also verify point-tool/menu reachability, preview-save immutability, identity/opacity, persisted reload, stale/cancelled contexts and unsupported-fill refusal.

This is source implementation; frozen app/bundled downloads, native packages, release archives, version and website remain unchanged. Native WKWebView and Figma reference verification remain pending. UI-14-034 must remain **partial** until the unsupported paint/stroke/fill/topology cases are implemented and tested.
