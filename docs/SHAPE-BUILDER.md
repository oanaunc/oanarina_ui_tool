# Exact rectangle Shape Builder

This source stage implements a bounded, destructive Shape Builder workflow for **part of UI-16-021**. It does not implement arbitrary vector-region Shape Builder or Boolean operations with editable text (UI-15-012).

## Reachable workflow

1. Select 2–16 eligible consecutive sibling rectangles in a Design document.
2. Open **Shape builder** in the right inspector and choose **Start Shape builder**.
3. Click or drag across regions. Every crossed arrangement interval is examined, including narrow regions between pointer events. Option-drag selects the subtraction operation. The native multiple-selection list provides keyboard access to every region, with Pick all/Clear actions.
4. Choose Merge picked regions, Extract one region, or Subtract picked regions. Extraction requires exactly one region. Merge/extract create a picked path and, if needed, a remaining-area path. Subtraction creates only the remaining area; intentionally subtracting every region removes all selected source geometry.
5. **Apply Shape builder** commits one Undo transaction. Picking changes no document data. Cancel/Escape discard the workflow. Space cancels an in-flight pick and allows canvas panning; changing the camera ends the source session. Delete/Backspace protect the source layers while the tool is active and explain the Subtract/Cancel choices.

Apply replaces the selected source layers, including their metadata, with ordinary editable filled path layers. Undo restores the complete original sources. There is no hidden controller, source snapshot, persistent custom schema or automatic recomputation. Existing `.oui` versions 1 and 2, copy/paste, save/reopen, SVG export/import and headless path consumers use the existing ordinary-path model. The operation does not add a new MCP capability or native permission.

## Geometry and limits

The kernel builds an exact orthogonal cell arrangement in the common parent coordinates. Cells sharing the same source coverage and a cardinal connection form one selectable region. Reverse shared cell edges cancel; oriented boundaries are traced with a deterministic rightmost continuation so diagonal contacts stay separate. Signed area must equal the selected cell area before any output is accepted. Real holes use the existing even-odd path fill rule. No sampling or rectangle-bound approximation of curves is used.

Supported sources are unrounded, individually unrotated/unreflected/unscaled, independent rectangles with the same opaque solid visible fill and no visible stroke. An arbitrary finite invertible **shared** rotated/reflected/nonuniform ancestor transform is retained. Independent edge strokes are detected even if their base stroke width is zero. Sources must be consecutive siblings; this prevents moving their result across unrelated intervening artwork.

Unsupported inputs refuse before mutation: text, curves, polygons, networks, rounded corners, individual transforms, transparency, different colors, non-solid paints (including hidden non-solid paints), visible strokes, affected Motion tracks, components/managed instances/slots, clipping/masks, visible effects, automatic layout, forms/media ownership and blending. Output metadata is deliberately new ordinary-path metadata rather than an attempt to transfer source annotations, property bindings or component ownership.

Budgets are explicit: 16 sources, 32 distinct coordinates on each axis, 961 grid cells, 3,844 boundary edges, 200 KB generated path data per path, 2 MB source-metadata inspection, 20,000 layers on the current page, 64 total source ancestry levels, and ±1,000,000 source/world-coordinate bounds. Distinct source edges must be at least 0.0001 parent-coordinate units apart. Combined parent-coordinate dimensions must not exceed 1,000,000. Document-wide generated-ID reservation is additionally limited to 1,000 pages and 100,000 total layers before collecting IDs.

## Rendering distinction

Geometry is exact within the stated subset; independent SVG path rasterization is not guaranteed to reproduce every original antialiased pixel. Merging all integer-coordinate source regions has an exact RGBA reference test. Signed-affine full-union results have a bounded native antialiasing comparison. **Extracting or splitting into separate same-fill path layers can introduce native antialiasing seams along their shared boundaries**, particularly with fractional coordinates or rotated ancestors. This limitation is shown beside Apply. A fractional signed-affine extraction test verifies changed raster pixels remain near arrangement boundaries; it does not claim pixel identity for split layers. There is no hidden duplicate geometry, bitmap fallback or compositing controller to conceal that distinction.

## Source and gesture safety

Minted, deeply frozen plans have private original-file/source/ancestor receipts. Headless Apply recomputes the eligible source and validates it against the receipt; forged, changed-file or changed-source plans refuse. The normal store transaction verifies every output remains exactly as planned after derivation, every source has gone, and the common parent matrix is unchanged. Controller interference refuses the entire transaction.

The live session records document/page/selection/mode/modal/Motion, tool/camera/UI scale, vector edit state and competing canvas modes. Synchronous subscriptions and a local generation invalidate retained handlers across away-and-back transitions. New choices cannot be overwritten by old controls. Pointer drafts require the original session and capture; foreign pointers are consumed without replacing the primary gesture. Escape, blur, hidden document, resize, scale changes, competing modes and source changes discard drafts. Activation cancels an already captured ordinary Canvas gesture before it can release a source mutation.

## Reference and status

The official [Figma Shape Builder article](https://help.figma.com/hc/en-us/articles/31616004109847-Create-custom-shapes-with-the-shape-builder-tool) describes region hover, drag merge, click extraction, Option subtraction and destructive results with Undo. Forma's supported exact-rectangle workflow is inspired by those named operations, with a separate explicit Apply step. General editable vector-network regions, arbitrary curved inputs, style reconciliation, Figma's full interaction/parity and broader raster-equivalence behavior remain unimplemented here. Recommend **partial** for UI-16-021; UI-15-012 remains planned.

## Verification

Domain headless tests cover the exact arrangement, all 511 nonempty subsets of a 3×3 grid against an independent Paper geometry containment oracle, holes and diagonal contacts, sparse-pointer traversal, counts/coordinates/area refusal, minted-plan ownership, locks/styles/stacking, signed ancestry, Undo/redo/save parsing, retained local/source sessions, and a 20,000-layer/63-ancestor operation-count fixture with no node-array `find` scans.

Actual browser checks cover draft-only native picking, sparse Option-drag subtraction, extraction/save/reopen/Undo, true exported SVG holes, exact integer full-union pixels, signed-affine full-union and split-boundary raster evidence, SVG reimport and ordinary clipboard behavior, retained source/local/reset handlers, pointer cancellation, already-captured ordinary moves, blur/resize/UI-scale interruption and recovery, and contained keyboard/native Space controls at 125%.

No app build, native package, installer, archive, release or website change is part of this pass.
