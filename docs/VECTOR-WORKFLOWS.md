# Vector editing workflows

These are source implementation changes. They do not constitute a new packaged release or complete Figma parity. Reference verification remains separate from implementation validation.

## Reachable controls

Select a vector shape and choose **Edit vector points** in the Vector inspector. Primitive shapes become editable paths. The same Vector menu command is available through Actions and the native command registry.

- **Close selected contours** closes the contours containing selected anchors, or all contours when no anchors are selected. Other contours retain their open state. Closing preserves existing endpoint tangents.
- **Continue open path** requires one open endpoint. Click to add straight segments or drag to give the new anchor mirrored tangent handles. Either end can be extended. Escape exits vector editing. Each completed new segment is one undoable edit; an interrupted preview never becomes document content.
- Select the two adjacent anchors of a segment and choose **Segment to curve** or **Segment to line**. A curve begins with collinear one-third chord handles; drag its handles to bend it. Other segments retain their handles.
- **Bend segments** offers direct segment or midpoint dragging with fixed anchors, retained layer/ancestor transforms and one-step Undo. Control makes new movement 10× finer; interrupted previews never enter saved documents or exports. See [VECTOR-BEND.md](VECTOR-BEND.md) for cubic behavior, coordinate bounds and conservative export padding.
- **Offset vector path…** opens signed parent-space distance controls and original/proposed SVG previews, with one undoable Apply. Closed regions support holes and concavity; open contours remain parallel open paths. See [VECTOR-OFFSET.md](VECTOR-OFFSET.md) for bounded curve approximation, protected contexts and the miter, square and round joins.
- **Make corner points** removes the selected anchors' handles. **Make smooth points** creates aligned tangents along the neighboring-anchor direction, with lengths derived from the adjoining chords. Other anchors retain their own handles.
- Drag a box in vector mode to select anchors. Shift adds anchors to the selection. The box tests actual transformed canvas anchor positions, including ancestor transforms. Clicking another eligible vector switches the layer being edited. Clicking another layer exits vector mode and selects that layer.
- A single selected point exposes numeric **Vector point X/Y** controls, committed on blur or Enter. These use the same stored parent coordinate system as the layer X/Y fields. Existing ancestor transforms remain intact; the edited path's own scale, flip and rotation are baked into normalized geometry. Unselected anchors retain their parent-space positions.
- **Round selected corners** creates a circular fillet tangent to both neighbors, whether each is a line or a cubic. The fillet is the crossing of the two offset curves at the radius, refined numerically; each arc cubic spans at most a quarter turn, and the kept curve pieces are exact de Casteljau restrictions of the source. An oversized radius becomes the largest fillet that fits within half of each adjoining segment's arc length, so neighbors never overlap. The result is baked geometry with one Undo, not a live per-point radius. Open endpoints, duplicate anchors, smooth anchors with no corner, zero-angle corners and curves that turn too sharply for the radius are refused before mutation, and a request with one refused corner changes nothing.
- **Vector winding rule** switches between nonzero and even-odd. The optional `fillRule` property persists in .oui v2, is accepted by the v1 migration, participates in component overrides, and controls canvas/prototype/export SVG fills, clip geometry and inside/outside stroke rendering. SVG import preserves the original rule without changing contour direction. Earlier files without the field keep their existing defaults.
- Expand **Paste SVG path data**, paste an SVG `d` attribute and choose **Replace with SVG path**. One transaction replaces this layer's contours. SVG command arities, finite coordinate bounds, arc flags/radii and resource limits are checked before Paper parses geometry. Full SVG markup uses the existing File import workflow.

## Safety and limits

New inspector geometry operations and direct `vector-*` topology commands require an unlocked layer outside managed instance children, with Motion closed. In Motion, **Edit vector points** can enter and leave an existing contour-based path without modifying the document or normalizing its base dimensions. Canvas anchor and tangent dragging uses the displayed sampled width, height and ancestor transforms, then commits only the base contours. This edits the shape across all animation times; it does not create contour keyframes. Existing base dimensions, path coordinate dimensions, transforms and animation tracks remain intact, and Undo restores the original contours. Primitive conversion, raw SVG-path conversion, continuation and point deletion remain blocked while Motion is open. Component/workspace derivation that would overwrite a proposed contour edit causes an atomic refusal. Persistent edits have Undo/Redo and retain .oui compatibility.

Vector gestures cancel when the document/page/source nodes, selection, tool, motion state/time, editing layer, modal, Home state, interface visibility, workspace mode or camera changes. Window blur, hidden-document visibility, Escape and pointer cancellation also discard the gesture. Armed continuation resets when its source or context changes. The existing native resource and IPC permissions are unchanged.

Limits: at most 100,000 path points, 1,000 contours, path-data length 2,000,000 characters and 100,000 SVG tokens. SVG coordinates and point-coordinate inputs are bounded to ±1,000,000; normalized dimensions must fit the existing document limits. These operations do not implement branch networks, bounded network-region editing, stroke outlines, path offsets, vector erasers or a general cut tool.

## Register recommendations

Implementation complete, with reference verification still pending:

- UI-14-003 Close vector path
- UI-14-004 Continue open vector path
- UI-14-011 Corner point
- UI-14-012 Smooth point
- UI-14-013 Convert segment to curve
- UI-14-014 Convert segment to line
- UI-14-019 Marquee vector points
- UI-14-020 Vector point coordinates
- UI-14-029 Vector winding rule
- UI-14-036 Paste SVG path data
- UI-14-048 Switch vector layer while editing

UI-14-032 Round vector corners now covers straight and cubic adjoining segments, as baked fillets. See [the rounding test](../tests/vector-corner-rounding.test.ts). Do not mark absent vector features implemented, or inflate the pen tool's overall status from these individual behaviors.

## Validation

- `npm test`: 762 tests across 71 files, including endpoint transforms, retained unused endpoint tangents, curve/line adjacency, numeric point coordinates under rotation/flip/scale, corner fillets and invalid-input refusal, SVG syntax/size bounds, winding persistence, and direct-command atomic refusal under lock/Motion/instance constraints.
- `npm run build`: TypeScript and production bundle validation; no installer or app package is created.
- Production browser checks: 14 passed (10 new and 4 existing). They cover real inspector controls, transformed point marquee, layer switching, click/drag continuation, modal/blur/camera/source interruption, Undo/Redo, saved files and recovery reload, SVG replacement and winding. Exported SVG is rasterized to verify that even-odd holes clip inside strokes correctly.
- Independent review reproduced and verified fixes for modal-interrupted continuation and even-odd inside-stroke clipping.

### Motion regression validation

Source-only repair: TypeScript validation, all 868 core tests and 29 related browser interactions pass without generating release packages. Browser coverage includes unchanged sampled-width/ancestor-scale anchor dragging, tangent editing, read-only entry/exit, saved-file preservation of base dimensions and tracks, Undo, and cancellation on time/camera/modal/blur/Escape changes. Topology controls and point deletion remain blocked in Motion.

Exiting vector editing with Escape, Enter or **Finish editing points** always clears the editing UI, including when the current path or its ancestor was locked after entry, the path became managed, or the source disappeared. Exiting skips normalization for locked, managed, missing, non-path and Motion sources and creates no document or Undo change in those cases. Entry and topology-edit guards remain enforced. Core cases and real Escape/Enter browser checks cover the protected exits and preservation of the lock transaction as the next Undo.
