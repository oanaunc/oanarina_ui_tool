# Decoded Figma scene mapping

`mapFigScene({message, images}, name)` converts the bounded decoder snapshot into a new, validated v2 `DesignDocument`. It does not read project paths, fetch remote images, touch editor state or mutate the decoded input. The workflow must call `validateFigSceneRasters(document, signal)` before installing the result: that browser gate decodes each distinct admitted fill/stroke raster and checks its intrinsic dimensions. `complete` means no reductions were reported by this mapper, not complete `.fig` format parity.

## Preserved current appearance

- Public design pages retain source ordering and canvas backgrounds. Internal style/dependency canvases are used for resolution without becoming visible pages.
- Local affine transforms retain hierarchy using the editor's existing rotation/reflection/scale representation. Nonuniform parent scale with a rotated child is allowed; unsupported local skew fails before mutation.
- Frames, rectangles, corner radii, ellipses/arcs, lines and available vector geometry become editable layers. Stroke outlines can become editable filled paths. Baked boolean geometry is imported without also painting its operands.
- Embedded static PNG/JPEG images retain pixels and alpha. Fill, fit and tile use existing paint behavior. Source stretch is an explicit editable paint mode rendered with `preserveAspectRatio="none"`. More complex crop/gradient transforms report reductions.
- Referenced local fill styles resolve their current paints rather than stale cached fallback colors. Supported variable aliases resolve current/default saved values; multiple saved modes report the fallback. Published library identities and live style/variable linkage are not imported.
- Instances materialize their source subtrees as detached editable frames. Opaque GUID correspondence, simple derived overrides, current text/visibility assignments and slot-content references are used, including internal stored slot content. Only source-root appearance defaults are inherited; source position, visibility, deletion and ownership state are not copied into instances.
- Native rich-document annotation blocks use their own embedded raster preview. They are editable image layers, not editable native rich-document text. The whole-file thumbnail is never used as the document or as a replacement for missing art.

## Editable text with original glyph appearance

When source glyph command data is available and styling can be represented as a whole-text outline, the text layer keeps its literal characters, font/style metadata and optional `textOutline` metadata. Untouched text renders the original glyph path, preserving source positioning even if the source font is unavailable. The path has an accessible text label; safe whole-text hyperlinks remain links in SVG output. Current fill, stroke and opacity still apply.

The outline is used only while its exact typography/layout signature matches. It includes characters, font family/size/weight/style, rich runs, axes, features, decorations, spacing, alignment, paragraph settings, truncation, width, height and clipping. Editing those properties falls back to normal editable text layout; Undo can restore the original outline. Moving, rotating or recoloring the whole text does not discard its shape. Font-refresh metrics leave a currently valid outline's original dimensions intact.

Mixed character styles, native decorations, unavailable glyphs and uncertain text layout report a reduction and use editable text instead. Source glyph outlines are local project geometry, not bundled font files. The outbound Figma plugin reports stretch fills as a FILL approximation and uses editable characters and available fonts; preserving this cached glyph metadata through a Figma round trip is not claimed.

## Validation and bounds

The mapper checks duplicate identities, missing parents, hierarchy/component/slot cycles, geometry/reference validity and the final saved document before returning it. Hierarchies are limited to 256 levels, reference chains to 64, and expanded output to 20,000 layers. Composed world matrices must remain finite, and padded artwork corners must remain within one million world units. A shared reference/property work budget also limits repeated traversal and inherited-map copying. Combined path data is bounded while appending; a separate geometry conversion budget prevents repeated shared blobs from amplifying processing without bound.

Only embedded hash references resolve images. Each admitted raster is bounded to 20 MB, 8192 pixels per side and 16 million pixels. Before allocating any browser image, the open gate also limits all distinct fill/stroke image data to 64 million pixels in total (about 256 MB for one RGBA pixel buffer). Repeated uses of identical image data count once and must declare consistent dimensions. PNG chunk boundaries/checksums and static framing are checked; animated PNG, GIF, WebP, SVG and remote images are not admitted by this import route. JPEG headers are inspected and actual browser decoding remains mandatory. Images and raw blobs are memoized. Per-node/page serialized size, including pretty-print indentation, is accumulated before full-document serialization, with a conservative 48 MB scene budget inside the existing 50 MB saved-project limit.

`textOutline` accepts bounded numeric path commands only; markup, URLs, invalid coordinates and oversized paths fail the shared rich-text/document validator used by parse, store and MCP pipelines. Invalid or stale metadata is never interpreted as executable SVG.

## Remaining reductions

This is a bounded import subset. Auto-layout is materialized at stored positions; live component/property/library editing, multi-segment nested overrides, full variable-mode inheritance, prototype interactions, corner smoothing, arbitrary effects/paint types, complex image/gradient transforms and native document-block editing are not full-parity features. Missing/unsupported records produce explicit notices, and invalid required references/bounds fail atomically. No binary `.fig` export is provided.

Synthetic core tests cover hierarchy/world matrices, ordering, current local fills, instance/slot/text assignment closure, source-root defaults, editable outline save/open and edit fallback, boolean operands, malformed metadata, cycles and resource amplification. Browser tests measure real SVG image-alpha/mask/stretch pixels, recoloring, links/accessibility, actual text/font/width edits and Undo, and `.oui` save/open. Separate source-module tests use `playwright.fig-scene.config.ts` to test corrupt stroke-image rejection and cancellation without changing the active document; they are outside the production app test directory. Private reference files, decoded records, screenshots and converted documents stay in ignored local validation storage and are not committed.
