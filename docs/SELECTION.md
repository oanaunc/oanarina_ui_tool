# Layer selection and navigation

Oanarina UI Tool has shared headless selection helpers, a keyboard-accessible layer tree, canvas hierarchy navigation and matching-property commands. These are working local behaviors, not a claim that the complete Figma selection system is implemented.

## Reference

The [Figma selection guide](https://help.figma.com/hc/en-us/articles/360040449873-Select-layers-and-objects) documents parent selection by default, Command deep selection, double-click descent, Enter/Shift–Enter child/parent navigation, Tab/Shift–Tab sibling navigation, layer-panel Shift ranges and Command toggles. It also lists selection by fill, stroke and text properties. The [frame guide](https://help.figma.com/hc/en-us/articles/360041539473-Frames-in-Figma-Design) and [beginner layer exercise](https://help.figma.com/hc/en-us/articles/30979556779159-FD4B-Clean-up-your-layers) clarify immediate-child selection. No private reference document content is included.

## Canvas and keyboard

The pure `resolveCanvasTarget` helper resolves an already geometrically determined hit. Normal clicks choose the outermost eligible parent. A selected node on the hit's ancestor path is retained, so dragging an already selected nested layer does not jump back to its outer container. Command-click selects the deepest hit. Double-click advances one level down the selected path. Effective ancestor visibility and locks apply to normal canvas selection. The canvas owns geometric hits, transforms, hover and drag behavior separately from these hierarchy helpers.

With focus on the design canvas and the Move/Scale tool active:

- Enter selects immediate visible, unlocked children of selected containers.
- Shift–Enter selects their parents, deduplicating shared owners.
- Tab/Shift–Tab cycle eligible siblings in layer-tree order, within their current parent. Moving past a sibling-list end wraps. A multi-selection advances beyond its selected edge.
- Enter on a vector leaf enters vector editing; Enter on a text leaf opens the inline text editor.

These keys do not hijack text inputs, textareas, select controls, contenteditable regions, buttons or tree-item navigation. Tab in an inspector field remains ordinary focus traversal. Commands are also reachable from the Edit menu/action search. Selection changes are ephemeral editor state and do not create document undo entries.

## Layer tree

The layer tree uses `tree`/`treeitem` semantics, selected/expanded/level attributes and a roving row tab stop. All sibling rows display front-to-back, including children. Locked and hidden rows remain available for explicit panel selection.

Click selects one row. Shift-click selects the contiguous displayed range from the anchor, including rows between different visible owners. Command-click toggles one row. Command–Shift-click adds a range. Collapsed descendants are outside a normal visible range. Searching expands the matching ancestor path even when it was collapsed and supports deeply nested names. Selecting a nested node elsewhere expands its ancestor path and scrolls its row into view.

Focused rows use Up/Down and Home/End to move through visible rows. Right expands a parent or enters its first child; Left collapses a parent or moves to its owner. Enter/Space activates selection. Shift with keyboard row movement selects a contiguous range. Disclosure, lock and visibility buttons retain their own keyboard activation; arrow navigation does not nudge the document artwork.

## Matching-property commands

**Select all with same fill**, **same stroke**, **same text properties**, and **same component** scan the current page's eligible visible, unlocked nodes. Fill/stroke comparison includes effective paint stacks and relevant geometry settings, ignores generated paint/stop IDs and normalizes hex case. Inactive gradient settings on a solid paint do not prevent a match. Text comparison excludes actual text content and base text color/link while comparing base typography/layout and exact mixed-character run intervals/styles. Component comparison includes the main component and instance roots sharing its ID; unrelated instance descendants are excluded.

Mixed text matching is deliberately strict: different run offsets or overrides do not count as the same text properties, even if a particular font happens to make them look similar. Matching is page-local, exact-property matching; this is distinct from Figma's structural matching objects across equivalent frame/section hierarchies. Pattern/name-based structural matching, selection by every Figma property category, keyboard box/pick cursors and full VoiceOver interaction parity remain separate requirements. Matching commands do not currently select hidden or inherited-locked layers; those can be selected explicitly through the layer tree.

## Evidence

`tests/selection.test.ts` covers parent/deep/descendant resolution, locked/hidden ancestors and cycles, children/parents/sibling cycling, multi-selection edges, layer-tree ordering/search/collapse/ranges, fill/stroke/text/component matching and selection commands without undo pollution. Fourteen selection tests and the four existing shortcut normalization tests passed.

`tests/e2e/selection.spec.ts` covers actual canvas keyboard focus, parent/child/sibling navigation, native input Tab, tree Shift/Command selection, ARIA row focus and arrow behavior, deep search, matching fill, inline text editing and canvas parent/deep/double-click paths. All **seven browser checks passed** after the canvas double-click handler resolved the underlying pointer hit when pointer capture retargeted the event. TypeScript validation passed for the selection changes.
