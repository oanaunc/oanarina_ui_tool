# Responsive grid layout

The grid flow is a layout engine, separate from the visual layout guides. Select a container, choose **Auto layout → Grid**, and edit columns, row count, gaps and padding. Converting a wrapped stack to a grid turns wrapping off.

## Tracks

Expand **Column tracks** or **Row tracks** to set each track to fixed pixels, weighted fractional fill, or hug contents. Minimum and maximum sizes apply together with these modes. A constrained fractional solver redistributes space when tracks reach limits; minimums can overflow a small parent and maximums can leave unused space. Horizontal defaults are equal fractions; vertical defaults hug content. Automatic row count grows around placed objects. A specified row count preserves empty rows and acts as a minimum, so reducing it never deletes objects.

Select the grid container to see editor-only cell guides and track edges. Drag an edge to set that track to a fixed size. The moving edge previews the requested size; artwork reflows on release as one undoable edit. Arrow keys on a focused edge adjust by one pixel, Shift by ten, Option by a tenth. Escape cancels. A document, selection or page change cancels an in-progress edit. These controls and cell guides are excluded from artwork exports.

## Cell objects

Select a direct child and use **Resizing → Grid cell**. Automatic positioning follows layer order, left to right and then down. Turn it off to enter a one-based row and column. Explicit objects reserve cells first; a collision moves the later object forward to free space. Spans reserve a rectangle of cells; fill sizing stretches artwork over the rectangle including its interior gaps. Start, center, end and stretch align the child within that cell. Hidden and ignored-layout children do not reserve cells. Ignored children retain their positions.

A narrower column count clamps effective placement and spans while preserving authored values for later expansion. Nested grids, main components and instance overrides use the same engine. Fields persist as optional additions to version-two `.oui` documents; files without them use the default track rules. The free saved-file MCP accepts the same fields and validation.

## Baselines

Horizontal stacks also offer **Text baseline** cross alignment. Direct text children align their first rendered SVG line; other direct children align their bottom edge. Hug height includes ascent and descent. This follows the application's current text renderer; nested-container baseline extraction and full native font-metric fidelity are unfinished.

## Bounds and remaining parity work

Track customization is limited to the first 256 tracks per axis, spans to 256 tracks and placement/row fields to 4,096. Layout is bounded to 1,000,000 resolved cells per grid and a bounded placement search. Invalid inputs fail before editor state changes; oversized imported grids are rejected. Cell rectangles are displayed only up to 500 cells to keep the overlay usable; track edges are available for the first 256 tracks.

Fractional/hug tracks in a hugging container use intrinsic non-fill content and the explicit minimums of fill children. A fill-only hugging cycle without minimums resolves to zero content, plus padding. Rotated or scaled children are laid out using their intrinsic width/height. Track reordering, deleting a track with Figma's object migration semantics, cell swapping, automatic-positioning controls at container level, canvas span snapping and dedicated insertion indicators remain unfinished. The solver uses bounded repeated measure/arrange passes; adversarial deeply cyclic sizing is not a CSS layout implementation.

Reference checked against [Figma's grid flow documentation](https://help.figma.com/hc/en-us/articles/31289469907863-Use-the-grid-auto-layout-flow) on 2026-10-29. The reference describes tracks, fractional fill, spans and manual positioning; this document records the implemented contract and differences. Exact desktop visual/interaction acceptance remains pending.

## Adding and removing tracks

Each row and column card in the grid inspector has **Add after** and **Remove**. Adding moves placed objects past that track along, grows spans across it and inserts a default track. Removing deletes the track settings and never deletes a layer: an object only in that track returns to automatic placement, and rows grow if everything no longer fits. Spans across the track shrink by one. Automatic objects stay automatic, and a grid keeps at least one track. Each action is one Undo. Instances edit tracks on their main component. Validation: `tests/grid-track-edit.test.ts`, `tests/e2e/grid-track-edit.spec.ts`.
