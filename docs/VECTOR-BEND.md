# Bend vector segments

Source implementation for UI-14-025. This does not establish complete Figma parity or native reference verification, and creates no packaged release.

## Use

Select a vector layer, choose **Edit vector points**, then enable **Bend segments** in the Vector inspector. Drag the visible segment itself or its round midpoint. The segment's endpoints become selected, so their incoming/outgoing tangent controls remain visible for further adjustment.

The two anchors stay fixed. A straight segment becomes a cubic Bézier; an existing cubic keeps its initial curvature and receives an incremental bend. The operation changes only the start anchor's outgoing handle and end anchor's incoming handle. Their opposite handles and every other segment retain their geometry. Both edited tangent modes become independent so a later handle edit does not unexpectedly move the adjacent segment. Closed contours support the final-to-first segment, including compound paths.

The grab parameter is estimated against the displayed cubic in canvas coordinates. Dragging near an anchor uses a parameter limited to 0.08–0.92 to bound handle amplification; use anchor/handle dragging for endpoint editing. At the grabbed parameter, the curve moves by the drag displacement using minimum squared movement of the two handles. This is a fixed-anchor cubic bend, not a Figma algorithm or gesture-fidelity claim.

Hold **Control** for 10× finer movement. Changing Control during a drag affects new movement and does not rescale travel already applied. Bends do not use object, pixel or angle snapping. Layer scale, reflection, rotation, path coordinate scale and ancestor transforms are retained rather than baked into a new path.

## Transactions and guards

The moving curve is an editor-only preview. Save and export continue reading the committed document while the pointer is held. Releasing commits one undoable transaction, with Undo/Redo and existing .oui v1/v2 parse support. Activating Bend or clicking without movement does not create history or new saved fields.

Escape during a bend cancels it and disables Bend while retaining point editing. With no bend drag active, the existing Escape behavior can exit point editing and cancel other Canvas gestures. Pointer cancellation, lost capture, window blur, hidden-document visibility, window resize, interface scale changes, document/page/source changes, selection/tool/vector-target changes, camera changes, modal/Home/interface visibility changes, and workspace/Motion changes discard the active bend. The mode is invalidated when its document or target context changes; another successful bend can remain armed on the same path.

Hidden or inherited-locked paths, managed instance children, boolean results, Motion, non-Design mode and Slides cannot start a bend. Collapsed transforms and zero-size paths are refused. Proposed handles, absolute control coordinates and grab geometry must be finite and within ±1,000,000. Imported contours outside this supported coordinate bound are refused before the overlay mounts; no geometry is changed. Component/workspace derivation that would overwrite the contour edit causes an atomic refusal.

## Artwork exports

A bend may extend beyond the original layer rectangle. Artwork export bounds now include the contour's scaled cubic control hull, transformed through the existing hierarchy, plus existing stroke/effect padding and ancestor clip constraints. This prevents an outward bend being cropped merely because its original rectangle stayed fixed. These bounds are conservative and can include extra transparent padding; they do not claim tight cubic extrema, exact miter bounds or exact intersections with rotated/nonrectangular clipping. Layer/slice export profiles that explicitly request their own bounds continue to use those requested bounds. Canvas selection boxes and stored layer dimensions are unchanged. SVG and raster rendering use the saved contour handles through the existing renderer; the bend overlay is never exported.

## Validation

- Focused pure/store coverage: straight and one-sided cubics; closing segments; retained adjacent handles; parent/path reflection, nonuniform scaling and rotation; nearest-parameter bounds; malformed/stale/nonfinite/oversized input; no-op/history; one-step Undo/Redo; old/new .oui parsing; lock/visibility/managed/Motion/context refusal; export control hulls and inherited clips.
- Actual Chromium interactions: reachable inspector and canvas paths, preview-save immutability, real project save/open, visible tangent handles, segment and midpoint grabs, transformed closing segments, Control precision, Escape/blur/modal/camera/source/pointer-cancel/lost-capture interruption, inherited Canvas Escape behavior, unsupported imported geometry, and outward exported SVG pixels.
- Full core and TypeScript checks, plus related vector and pointer browser regressions. Native WKWebView/VoiceOver and a Figma desktop gesture round trip remain unverified.

Recommendation: UI-14-025 **implemented** for these explicit fixed-anchor cubic behaviors, with **reference-verification-pending**. Network branch bending, variable-radius deformation, path offsets and cutting tools remain separate features.
