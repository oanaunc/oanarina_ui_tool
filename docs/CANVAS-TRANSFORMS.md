# Canvas transform scope

Dragging translates selected roots in world coordinates through their complete ancestor matrix. Descendants move once even when both parent and child are selected. Single-layer resize handles follow the layer's own axes, including ancestor rotation, reflection and independent scale. Vector anchors and tangents map between intrinsic path coordinates and world coordinates; their handles keep a constant screen size. Creation inside supported editable frames converts pointer coordinates to the frame's coordinates. Managed instance descendants are excluded as drawing destinations.

Frame resize previews derive constraints and layout for display, while the history transaction commits the raw mutation. This prevents derived instance positions from becoming authored overrides. Resized component instances retain their derived placement on subsequent edits; see the validation report for regression evidence.

Group resizing and the Scale tool scale the rendered subtree through existing transform fields. Text, strokes, effects and corners therefore participate visually. Intrinsic dimensions remain in the inspector. Scale gestures can author scale tracks when the motion timeline is open, preserving the static scale as the initial keyframe. Multi-selection scales around its world bounding box.

Selection, individual multi-selection and hover outlines use transformed layer corners. They describe layer bounds, not the exact contour of every visible glyph, stroke or mask. Marquee inclusion tests full world bounds. Locked ancestors prevent dragging, point edits and resize handles.

True affine shear cannot be represented by the current node model. A nonuniform multi-selection resize or hierarchy change that requires shear is rejected before mutation, with an error. Uniform proportional resizing remains available. Collapsed transforms and out-of-range positions are rejected. Rotated resize snapping is currently bypassed; arbitrary-angle snapping, a custom rotation origin, tight group bounds, and full intrinsic-dimension/scale normalization remain unfinished.

Core tests exercise rotated/reflected/nonuniform ancestors, opposite-corner preservation, constraints, vector conversion, group scaling and motion. Browser tests exercise real pointer drag/resize/vector gestures, history, saved documents and locked selections. Universal builds and a native smoke test do not establish complete native visual or accessibility parity.

## Rotation, ratio locks and parent alignment

The circular rotation handle follows layer axes and accumulates successive angular deltas through complete turns. Shift snaps to the locally configured increment. Multiple layers rotate about their world selection center; true skew is rejected. Motion auto-key preserves the authored clockwise/counterclockwise angle, while base edits offset existing rotation tracks. Rotate/flip commands normalize selected roots and respect inherited locks.

Option-resize keeps the world center fixed. The aspect-lock button persists an optional `.oui` field, constrains each selected layer separately, and honors feasible min/max limits. Numeric updates create per-layer dimensions before auto-key generation; conflicting limits reject the transaction. MCP width/height updates use the same ratio helper. Explicit width+height pairs remain explicit.

A single selection aligns in its parent axes; multiple selections align their world bounds. Shift-click alignment or explicit parent commands moves each same-parent group together. Auto-layout-controlled children use the parent layout controls. Distribution retains endpoint layers. Pointer gestures snapshot selection, tool and motion context, pause active playback when editing begins, and cancel on a context/document change.
