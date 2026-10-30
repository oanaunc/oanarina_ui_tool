# Move editable layers between pages

Select layers in Design or Whiteboard, then choose **Object → Move to page…**, search for the action, or use the layer context menu. Search the destination list and choose **Move layers**. The editor selects the moved objects on the destination page. Escape or Cancel closes the dialog without changing the project. Destination choices support Arrow keys, Home and End; the dialog traps keyboard focus.

This is a same-document move. Every existing layer ID, component/set ID, whiteboard record ID, flow/track/keyframe ID and shared-library reference is preserved. It does not use the clipboard or create independent component definitions. Children move with their owning root; relative layer order is retained, with the transferred roots placed above existing destination artwork. Roots detach to the destination page root at their existing world geometry. The operation is one document Undo/Redo step and survives a normal `.oui` save/reopen without a schema change. Page cameras remain separate device-local settings.

The dialog reviews actual transferred layer counts, flows and animation tracks. It validates a cloned project before moving. The store validates again after the normal component, text, layout and whiteboard derivation pipeline, before changing the document, timestamp or history. If those updates would change moved geometry or linked-instance geometry, the operation fails with a message and leaves the source unchanged.

## Preserved ownership

- Complete frames/groups, main components, linked instances and complete component sets can move. Shared main/source/style/variable/font/layout-guide-style references remain document-wide; live instances retain their links and overrides. Page-root moves and identity-transform detachments keep unchanged rotation/flip/scale fields live with the main. A transform changed by detaching from an ancestor becomes an explicit override on that moved instance.
- Node-owned layout guides move with their node. Page comments, canvas guides, background and prototype display settings stay on the original page. The schema has no layer ownership for page comments; the app does not infer ownership from their coordinates.
- A flow whose start layer moves transfers to the destination with its identity. A conflicting destination flow ID is refused.
- Animation tracks on moved layers transfer with their IDs and keyframes. With no destination timeline, its duration/frame rate/loop settings are adopted from the source; otherwise those settings must match. Absolute X/Y keyframes receive the exact coordinate offset required by detachment. Root animation under a transformed external ancestor and animation inherited from an omitted ancestor are refused.
- Sticky notes and tables move as complete logical objects. Connectors, their owned path/label/arrows and both endpoints must remain on the same page. Connectors between two selected objects are included automatically. A mind map must remain complete, including its topics and connector ownership. Record identities, votes and the document-shared voting/timer sessions are retained; no votes are duplicated.

## Explicit limits

This workflow is partial relative to unrestricted Figma page moves. It refuses unsafe context instead of flattening or dropping behavior:

- Presentation deck source/destination pages; use the Slides workspace for slide artwork.
- Locked selected layers or locked external ancestors; managed instance children without the complete owner; children taken out of a main component or Boolean object.
- Partial component sets, whiteboard ownership or connector endpoints; page-local prototype source/target links split by the move, including conditional actions and inherited instance interactions. Component and variant-definition references remain document-wide and may span pages.
- A mask source/masked sibling moved out of its run; move the containing mask group instead. A destination with a page-level sibling mask must group that mask and its artwork first, preventing newly added artwork from becoming masked accidentally.
- Removed ancestors with clipping, masks, hidden state, nontrivial opacity/effects/blending/isolation or explicit variable-mode context. Move the containing frame/group to keep those relationships editable.
- Collapsed or skewed transforms, geometry beyond document limits, a main whose changed intrinsic transform would alter surviving linked instances, incompatible timelines or metadata ID collisions.

The existing limits of 20,000 layers per page and 50 MB per project apply before mutation. No cross-document move, private Figma clipboard format, cloud sharing or native clipboard permission is added.

## Checks

`tests/move-layers.test.ts` covers identity and geometry, live components and later edits, legacy overrides, set/whiteboard ownership, votes, recursive prototype boundaries, motion/flow migration, context refusals and atomic post-derived validation. `tests/e2e/move-layers.spec.ts` exercises context-menu and action-palette reachability, destination filtering/keyboard access, editable save/reopen, Undo/Redo, unsafe moves and stale-dialog handling. Browser native transport is a fixture; it is not a Mac shell runtime acceptance claim.
