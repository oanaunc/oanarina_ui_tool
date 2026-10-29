# Layer-tree structural editing

The development editor provides layer drag reorder/reparent, descendant expansion controls, type filtering, contextual actions and previewed batch renaming. These are local document paths with the existing undo and `.oui` persistence. They do not complete every Figma layer-tree, accessibility or large-document requirement.

## Drag layers

Drag a layer row or an existing multi-selection in the Layers panel:

- The upper/lower row edges place the selection before/after that row in displayed front-to-back order.
- The middle of an ordinary container nests the selection inside it as its frontmost children.
- **Drop here to move to page root** removes the current parent. This control can also be clicked or keyboard-activated for the selection.

A line or container outline shows the candidate position. An invalid destination shows a denied indicator and the specific preflight reason. No document edit occurs for a denied drop. Selected ancestor/descendant pairs normalize to their independent roots; owned subtrees stay attached, and displayed root ordering is retained even when an imported document's flat node array interleaves parent subtrees. Moving several roots is one undo transaction.

The headless `planLayerMove(nodes, ids, targetId, placement, document?)` returns a fully cloned replacement page array. It does not mutate its inputs. Changing owners uses `reparentPreservingWorld` and preflights all source transforms before mutation. Ordinary rotated/flipped/scaled owner changes preserve rendered corners. A transform requiring unsupported skew, a collapsed destination or values beyond model limits is rejected atomically. Existing auto-layout containers can subsequently arrange their children through the normal layout engine; preserving world geometry does not override flow layout.

Inherited locks, missing selections/destinations, duplicate source IDs, cycles, noncontainers and live boolean containers are guarded. Managed instance children cannot be detached through drag and new children cannot be inserted into an instance-managed hierarchy; detach the instance first. Instance roots can move as whole objects. With document context, generated sticky/table children must move with their owning object, and slide frames remain under the slide navigator's ordering controls. Masks retain their source metadata; their scope follows the resulting sibling order. This is not a promise that arbitrary independent structural edits preserve every specialized workspace semantic.

## Browse and act

**Expand all** and **Collapse all** operate on the page hierarchy. The layer context menu provides scoped **Expand descendants**/**Collapse descendants**. **Layer type** filters exact node kinds and retains each matching node's ancestor path. Type filtering expands the path so a collapsed parent cannot hide a match. Text search combines with the type filter.

Right-click a row or press Shift–F10/Context Menu on a focused row. Existing multi-selection is retained when the row belongs to it; otherwise that row is selected. Menu actions include parent/children selection, copy/cut/paste, duplicate, rename, group/ungroup, lock/visibility and masking. Actions reuse their existing command validation and undo behavior. The Layers header's action button opens the same menu. Menu arrows/Home/End move focus; Escape closes it. Ordinary layer-tree ARIA navigation, visible Shift ranges and Command toggles remain available as documented in [SELECTION.md](SELECTION.md).

## Batch rename

Choose **Batch rename…** in the layer context menu. A preview lists every selected name and its proposed replacement before mutation. Find/replace is literal text, not regular expressions. The template supports `{name}` for the replaced original name and `{n}` for a sequential whole number, starting at the chosen nonnegative index. Ordering follows the displayed hierarchy, independently of collapsed state. Placeholder-like text inside an original name or replacement remains literal; template substitution happens once.

Names must contain 1–512 characters after substitution. Locked selections and managed instance descendants are rejected before any name changes. Apply renames all selected layers in one undo step. Cancel/Escape leaves names unchanged; keyboard focus is contained in the dialog and returns to the layer row when dismissed through its controls. Duplicate names are permitted, matching the document model's existing behavior.

## Evidence and limits

`tests/layer-operations.test.ts` passed **16 checks**: visual ordering, transformed reparent/unparent, normalized descendant ownership, invalid/cyclic targets, inherited locks, managed instances, atomic skew/collapsed-transform rejection, mask metadata, workspace child guards, expansion/type paths, literal batch templates, invalid names, undo, interleaved imported subtree order and nonrecursive placeholder substitution.

`tests/e2e/layer-tree.spec.ts` exercises actual HTML drag-and-drop and save/undo paths, compares saved world corners under transformed parents, moves multi-selections atomically, denies invalid/locked operations, filters/expands the real tree, previews/applies/undoes batch names, and operates the keyboard context menu. All **eight browser checks passed**, including keyboard activation of the page-root control and its undo. The prior seven selection/browser checks also passed after integration. The synthetic screenshot `build/screenshots/dev-layer-tree.png` shows the development editor's batch-rename workflow.

Native WKWebView gesture acceptance, every auto-layout/nested component/workspace combination, large-tree virtualization/performance, keyboard drag-and-drop, type-ahead menu search, hover auto-expansion while dragging, layer thumbnails and full VoiceOver behavior still require separate work. No arbitrary cross-page or cross-document layer drag is claimed. Screen-reader tree semantics and focus behavior are useful coverage, not a complete accessibility certification.
