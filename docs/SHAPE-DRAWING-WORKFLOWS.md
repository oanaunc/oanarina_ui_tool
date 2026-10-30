# Shape drawing workflows

These are source changes for the Mac-first editor. They do not deliver a new app package or complete Figma parity. Reference verification remains separate from implementation validation.

## Drawing from the center

Choose Rectangle, Ellipse, Line, Arrow, Polygon or Star. Hold Option while dragging to expand around the initial pointer position. Add Shift to constrain area shapes to equal width and height; lines and arrows retain their horizontal, vertical or diagonal direction. The canvas hint describes these modifiers. Changing either modifier while the pointer is stationary updates the preview, and releasing the pointer uses the current modifiers. Option-click creates the usual default size centered on the click. Frame, Section and Slice also support center drawing; text retains its normal insertion origin.

For lines and arrows, the start is the mirrored endpoint and the end follows the pointer. Reverse drags retain endpoint order and the arrowhead stays on the intended end. Stored shape dimensions and ordinary shared paths feed canvas, prototype and exports.

Drawing uses the destination parent's coordinate system, including rotation, reflection and nonuniform scale. In Motion, parent hit testing and preview use the sampled transforms. Committing converts only the new node's origin back into the base parent's coordinate system. Existing parent properties and animation tracks remain intact; drawing creates a base shape, not a new contour or geometry animation. Auto layout still positions new children according to its existing layout rules.

Creation is one document edit with Undo/Redo and .oui persistence. A parent locked before drawing is excluded as a destination; locking it during the preview cancels creation. Document/page/source changes, selection/tool changes, Motion time/mode changes, modal/Home/interface/camera changes, window blur/resize, hidden-document visibility, Escape, pointer cancellation and lost capture discard shape previews. Coordinates and dimensions are validated against the drawing limits before mutation.

## Repeating the last shape tool

The last basic shape tool is available on the main shape-toolbar button after returning to Move. **Repeat last shape tool** appears in the shape dropdown, Actions and canvas context menu. Its Forma shortcut is **Option+R**; Shift+R continues to toggle rulers. Repeating selects the remembered drawing tool and leaves the document and Undo history untouched. The existing Keep drawing tool preference continues to control whether a completed draw returns to Move.

Only the six basic shape tools are remembered. Their selection is local UI state, separate from the .oui document, and is restored from a validated local-storage value. Missing, invalid or blocked storage falls back to Rectangle; blocked storage still allows repeating during the current session. A modal, Home or Slides workspace refuses the direct repeat command. The Actions palette closes itself before executing it.

## Register recommendations and limits

- UI-11-029 Center-based shape drawing: implementation complete; reference verification remains pending.
- UI-11-030 Repeat last shape tool: implementation complete; reference verification remains pending. Option+R is a Forma shortcut, not a verified Figma shortcut.
- UI-11-005 Corner smoothing: unchanged/planned. Circular corner radii and straight polygon fillets are not continuous corner smoothing. No smoothing approximation is counted here.

The documented center modifiers match the public [Figma Shape tools guide](https://help.figma.com/hc/en-us/articles/360040450133-Shape-tools). This is documentation reference only; it does not replace desktop comparison or round-trip verification.

## Validation

Core cases cover center/aspect geometry, reverse endpoint order, default clicks, finite coordinate/dimension refusal, validated local memory and read-only repeat commands. Real browser checks cover all six tools, transformed and Motion parents, stationary modifiers, centered clicks, Undo/Redo, saved files and recovery, repeat controls and interrupted creation. Existing line/arrow, transform and Motion-vector regressions are rerun alongside these checks. No release builds, native bundles, archives or download changes are part of this source batch.
