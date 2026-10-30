# Vector editing workflows

These are source implementation changes. They do not constitute a new packaged release or complete Figma parity. Reference verification remains separate from implementation validation.

## Reachable controls

Select a vector shape and choose **Edit vector points** in the Vector inspector. Primitive shapes become editable paths. The same Vector menu command is available through Actions and the native command registry.

- **Close selected contours** closes the contours containing selected anchors, or all contours when no anchors are selected. Other contours retain their open state. Closing preserves existing endpoint tangents.
- **Continue open path** requires one open endpoint. Click to add straight segments or drag to give the new anchor mirrored tangent handles. Either end can be extended. Escape exits vector editing. Each completed new segment is one undoable edit; an interrupted preview never becomes document content.
- Select the two adjacent anchors of a segment and choose **Segment to curve** or **Segment to line**. A curve begins with collinear one-third chord handles; drag its handles to bend it. Other segments retain their handles.
- **Make corner points** removes the selected anchors' handles. **Make smooth points** creates aligned tangents along the neighboring-anchor direction, with lengths derived from the adjoining chords. Other anchors retain their own handles.
- Drag a box in vector mode to select anchors. Shift adds anchors to the selection. The box tests actual transformed canvas anchor positions, including ancestor transforms. Clicking another eligible vector switches the layer being edited. Clicking another layer exits vector mode and selects that layer.
- A single selected point exposes numeric **Vector point X/Y** controls, committed on blur or Enter. These use the same stored parent coordinate system as the layer X/Y fields. Existing ancestor transforms remain intact; the edited path's own scale, flip and rotation are baked into normalized geometry. Unselected anchors retain their parent-space positions.
- **Round selected corners** creates circular cubic fillets at straight-sided corners. Radius is clamped to half each adjacent edge. Curved adjoining segments, open endpoints, duplicate anchors and zero-angle corners are refused before mutation. Arbitrary curved-corner rounding remains unimplemented.
- **Vector winding rule** switches between nonzero and even-odd. The optional `fillRule` property persists in .oui v2, is accepted by the v1 migration, participates in component overrides, and controls canvas/prototype/export SVG fills, clip geometry and inside/outside stroke rendering. SVG import preserves the original rule without changing contour direction. Earlier files without the field keep their existing defaults.
- Expand **Paste SVG path data**, paste an SVG `d` attribute and choose **Replace with SVG path**. One transaction replaces this layer's contours. SVG command arities, finite coordinate bounds, arc flags/radii and resource limits are checked before Paper parses geometry. Full SVG markup uses the existing File import workflow.

## Safety and limits

New inspector geometry operations require an unlocked layer outside managed instance children, with Motion closed. Direct `edit-vector` / `vector-*` commands enforce the same requirements. Component/workspace derivation that would overwrite a proposed contour edit causes an atomic refusal. Persistent edits have Undo/Redo and retain .oui compatibility.

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

Partial: UI-14-032 Round vector corners, limited to straight adjoining segments. Do not mark absent vector features implemented, or inflate the pen tool's overall status from these individual behaviors.

## Validation

- `npm test`: 762 tests across 71 files, including endpoint transforms, retained unused endpoint tangents, curve/line adjacency, numeric point coordinates under rotation/flip/scale, corner fillets and invalid-input refusal, SVG syntax/size bounds, winding persistence, and direct-command atomic refusal under lock/Motion/instance constraints.
- `npm run build`: TypeScript and production bundle validation; no installer or app package is created.
- Production browser checks: 14 passed (10 new and 4 existing). They cover real inspector controls, transformed point marquee, layer switching, click/drag continuation, modal/blur/camera/source interruption, Undo/Redo, saved files and recovery reload, SVG replacement and winding. Exported SVG is rasterized to verify that even-odd holes clip inside strokes correctly.
- Independent review reproduced and verified fixes for modal-interrupted continuation and even-odd inside-stroke clipping.
