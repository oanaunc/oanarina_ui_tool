# Layer masks

Layer masks are a non-destructive local document feature. They reuse normal editable layers and the shared SVG artwork renderer. Masking does not crop away or delete concealed source artwork. This implementation is an additional parity stage, not a claim of complete Figma masking or interchange parity.

## Reference behavior

Figma documents three modes: Alpha uses source transparency; Vector uses painted fill/stroke regions at full opacity; Luminance uses source brightness and opacity. Mask sources can be shapes, text, images, or groups. The source is behind its masked siblings and stops at another mask or the containing hierarchy boundary. Multiple selected layers form a mask group; the source and target artwork remain independently editable. These are verified against the [Figma Masks guide](https://help.figma.com/hc/en-us/articles/360040450253-Masks) and [Figma MaskType API](https://developers.figma.com/docs/plugins/api/MaskType/). No private Figma file content or screenshots are used here.

## Editing and structure

Select unlocked sibling layers and choose **Use as mask** in the inspector or Object menu, or press **Control–Command–M**. The shortcut toggles a selected source off. The backmost selected sibling becomes the source, regardless of selection click order. A multi-layer operation creates an ordinary group around the selected roots; descendants stay attached to their original selected root. Source and artwork coordinate values are preserved, including under rotated or flipped ancestors. Selecting a single layer marks it as a source in its current sibling stack. Later siblings become masked until the next source. Each nested parent has its own stack. Mask regions follow transformed geometry, inherited scales and effect padding; a collapsed parent does not require an inverse transform to render.

The **Layer mask** inspector shows the active source, masked sibling count and a mode selector. It can select the source from a masked target or release the mask. Release restores the source as normal artwork and exposes concealed content; the ordinary mask group remains editable. The source's own painted artwork is consumed by the mask, rather than drawn over the result. Its layer remains available in the layer tree. Source rows now show a mask icon with α/V/L for Alpha/Vector/Luminance; target rows show a dotted-circle indicator. Tooltips and accessible row descriptions identify the nearest affecting mask source, mode and inherited ancestor coverage. Each containing hierarchy retains its own sibling run, and another source starts a new run. Artwork inside a source group is not labeled as a target of that source itself. A nested source may show both its own source marker and inherited coverage from outside its parent. These indicators are derived read-only chrome: hover/focus does not edit the project or history, and normal tree selection, rename, drag and keyboard navigation stay available. Source display names in indicator text/tooltips are truncated after at most 256 UTF-16 units with an ellipsis, without splitting a surrogate pair; the full layer name and source ID stay unchanged. This bounds repeated target descriptions for imported long names. They identify structural mask membership, including hidden sources; they do not promise visible nonzero pixels.

Moving, resizing, rotating, recoloring or changing the source's paints modifies the revealed region without changing target geometry. Moving the mask group moves the composite through the existing group transform path. Edits run through normal document transactions for undo, redo and `.oui` persistence.

## Modes and exports

**Alpha:** the rendered source's transparency controls target visibility. This includes actual image alpha, stacked fills, gradients, strokes, group opacity and the existing source effect renderer. A partially opaque source yields a partially opaque result. A hidden or fully transparent source reveals nothing.

**Vector:** visible source fill and stroke regions render opaque geometry. Nonzero paint and layer opacity become fully opaque. Absent or zero-opacity paint regions stay absent. An image paint contributes its image layer outline, so transparent image pixels do not carve a vector mask. Existing paths, ellipses, text glyphs, stroke alignment, rotation, flips and nested clips define the region; the mode does not substitute the source's bounding rectangle for its vector geometry. Effects are omitted in vector mode.

**Luminance:** source brightness and alpha both control visibility, through SVG's luminance mask mode. White reveals, black conceals, and intermediate colors produce partial transparency. Raster image pixels and gradient samples participate in the same renderer.

The shared artwork renderer emits real SVG `<mask>` definitions with user-space coordinates and alpha/luminance interpretation. Vector mode renders its opaque painted geometry into an alpha mask. The same SVG feeds PNG/JPEG export, so masks are applied to actual exported pixels. This is not a CSS clip overlay. Source transforms are evaluated in the same parent coordinate system as their targets, and nested sources get separate definitions. Within an outer vector-source group, nested mask sources are also evaluated as opaque vector geometry. This is the local rendering contract; exact nested-composition parity with Figma still needs a dedicated reference fixture.

## Schema and validation

`DesignNode.mask?: {mode: 'alpha' | 'vector' | 'luminance'}` marks a source. There are no cross-document source IDs or references to remap: scope is determined by same-parent sibling order. This additive optional field preserves version-one/two `.oui` compatibility. Mask metadata is included in component override tracking and propagation.

Strict validation checks the mode, the metadata's exact shape, supported source kind, existing owner chain and owner cycles. Slice nodes cannot become masks. Applying a selection validates presence, ownership and inherited locks before any mutation. Disparate parents are rejected; selected descendants are normalized beneath selected ancestors. The full parse and editor/MCP validation pipeline must run before accepting imported document changes.

Core helpers in `src/masks.ts` are `maskRuns`, `maskForNode`, `canApplyMask`, `applyMask`, `releaseMask`, `setMaskMode` and `validateMasks`. They operate on headless document data; the inspector wraps mutating calls in the shared undo transaction.

## Current limits

Mode hover previews and a dedicated mask-outline view are not yet implemented. Tree descriptions report the nearest structural source rather than enumerating every nested composite; full VoiceOver/native acceptance is separate. Canvas and prototype selection hit-testing still use the editor's existing geometry selection rules rather than per-pixel mask alpha. Group resizing follows the existing general group/constraint behavior. Exact visual parity for every effect, blend mode, font glyph, stroke join and native WKWebView version needs broader fixtures. Export viewBox bounds may conservatively include concealed artwork and transparent margins. Shared SVG/PNG rendering does not establish editable arbitrary-SVG import, Figma plugin mask round trips, or binary `.fig` support. The feature register should retain these limitations until their own paths are implemented and tested.

## Validation evidence

`tests/masks.test.ts` checks source ordering, sibling scope, nested ownership, group selection normalization, exact world-transform preservation, mode/release behavior, malformed metadata and owner cycles, compatible persistence, actual SVG definitions, opaque vector fill/stroke regions, invisible paints and one-step undo/redo.

`tests/e2e/masks.spec.ts` exercises the reachable inspector and actual exported pixels for image alpha, vector image outlines, luminance image brightness, ellipse stroke-only masks, gradient luminance and PNG output. All **ten browser checks passed** after integration, including actual blur feathering, group child regions and text glyph coverage. The mask core suite passed **15 tests**. A focused mask/rich-text/component regression run passed **58 tests**. Broader and native validation remain the release workflow’s separate checks.

`tests/mask-indicators.test.ts` covers sibling/ancestor scope, interleaved flat arrays, nested sources, literal names, read-only derivation, deep hierarchies and defensive invalid ownership termination. `tests/e2e/mask-indicators.spec.ts` checks accessible/visible source and target indicators, mode/rename/release/Undo/reload updates, and read-only hover/focus with existing tree navigation.

The indicator addition passes seven targeted core tests (22 with the existing mask core suite), TypeScript/production build and all 14 production browser checks (four indicator workflows plus ten existing actual mask rendering/export checks). Tests seed once and await the visible completed recovery state before reload; no application timeout was increased.
