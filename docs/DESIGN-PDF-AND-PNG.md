# Design PDF and PNG color metadata

Unreleased source after dev.12. No app build, installer, resource archive or website deployment is included. Source behavior and exact Figma reference acceptance are separate.

## Design PDF

Export → Design PDF can render current artwork (selection, or the whole current page), each selected frame, or the current page's outermost frames. Frames inside groups/sections are eligible for the outermost mode; frames inside frames, components or instances are excluded from that automatic list. Explicitly selected nested frames can be separate pages. Pages follow document paint order, shown in the preview list. Saved layer export profiles are independent of PDF settings.

Frame pages use their exact width/height and remove their world transform, including rotated parents. The overlap toggle crops the page paint stack through each frame, preserving the shared ancestor clip/mask handling. Combined artwork uses the existing visual-bounds rules. Hidden layers can be included in an export-only snapshot; document visibility is untouched. Layout guides can be included explicitly. Exporting locked/managed layers is read-only and does not require unlocking them.

By default PDF artwork is **flattened raster imagery**. **Keep shapes as vectors** writes solid fills and strokes as real PDF paths with clips, in paint order, including corner radii, rotation, dashes and inside, center and outside strokes. Everything else stays raster at the chosen resolution inside its place in the paint order: text, images, gradients, effects, blends, masks, Boolean results, arrowheads, per-edge and variable strokes, and containers with reduced opacity. Separated raster areas merge, a page with more than 64 areas or 200,000 path segments is flattened, and layout guides and Display P3 files use the flattened path.

In both modes a layer's `http`, `https` or `mailto` hyperlink becomes a live PDF link over its bounds, and text gets an invisible layer for search and copying. That layer uses the standard Helvetica font, so characters outside its encoding are left out, selection boxes only approximate the artwork, and text on a path or under a mirrored or skewed transform has no text layer. Links set on part of a text layer are not written. Fonts are not embedded and PDF text is not editable. Video uses its poster; animation uses the current Motion sample, and no playback is embedded. The Mac native save menu uses the flattened mode. Slides retain their separate deck PDF workflow.

One design pixel becomes 0.75 PDF points (96 pixels per inch). Image scale changes embedded image resolution, not physical page dimensions. Choices range from 0.5× to 4×. The PDF supports up to 200 pages, 14,400 points per edge, 16,384 raster pixels per edge, **80 million raster pixels across the complete PDF**, and 100 MB each for accumulated source, embedded image bytes and final output. Limits are checked before decoding where possible, rather than allowing many highly compressible pages to consume unbounded raster memory.

The complete SVG/font/image snapshot is captured before any await. The normal image preflight catches broken nested assets rather than silently omitting them. Document/page/selection/modal/mode/Motion changes or Cancel discard pending output; temporary raster URLs are revoked. PDF export does not change Undo, profiles or saved project data. Mac uses the existing save API without added permissions; native PDF save acceptance awaits a future authorized build.

## PNG color metadata

Saved PNG profiles and combined exports offer **Browser default**, **Tag sRGB**, and **Untagged sRGB pixels**. Browser default preserves existing encoding behavior and old profiles. An optional `pngColorProfile` value (`srgb` or `none`) travels in saved export settings, instance overrides and `.oui` files, with validation before import/store/MCP mutation. Combined choices remain local to the dialog. Batch assets use each saved choice and record it in their checksum manifest.

Raster output explicitly requests an sRGB canvas. Tagging writes the standard sRGB chunk (perceptual intent), gAMA and cHRM metadata before image data; untagged output removes color-space metadata. Conflicting ICC and HDR metadata is removed in either explicit mode. Pixel/alpha and IDAT bytes remain unchanged by metadata processing. Output chunks are bounded and CRC-checked before a new PNG is emitted. The values/order follow the [W3C PNG specification](https://www.w3.org/TR/png/#11sRGB).

This supplies explicit sRGB/untagged delivery, **not custom ICC, Display P3, CMYK, or document-wide color management**. Figma editable Bridge validates the choice, then reports all export profiles as omitted as before; source/API-contract validation is not a real desktop plugin round trip. Existing downloadable Bridge and standalone MCP archives are unchanged.

## Validation

Source checks include pure page plans, immutable snapshots, page/pixel/source limits, malformed metadata refusal, saved reopening/Undo, PNG chunks/CRCs and byte preservation. Real browser checks load resulting PDF documents, inspect page sizes and their actual embedded pixels, compare rotated/overlap crops, hidden pages and resolution independence, and verify broken-image/cancellation refusal. PNG browser checks decode real output pixels, inspect metadata/unchanged IDAT, reopen profiles and verify batch checksums. No native application, external PDF viewer or exact Figma acceptance is claimed.

This worktree's source validation passes 952 core cases in 88 files, editor/MCP TypeScript checks, 41 MCP source/protocol cases, and 21 browser checks (seven PDF, three PNG-profile and eleven existing export-delivery checks). These are source results before integration with other parallel work. Registry recommendations: UI-40-007 remains partial until vector/live-link PDF behavior is implemented; UI-40-030 is partial for sRGB/default/untagged choices while wider color-profile management remains unfinished.

## Vector PDF validation

**Embed fonts and images** appears with Keep shapes as vectors and is on by default. Text becomes a Type 0 CID TrueType font subset with Identity-H and a ToUnicode map, placed at the browser's own glyph origins, so it stays sharp, selectable and searchable. PNG and JPEG fills go in as image objects at their original pixels, one object per distinct image. The native save path still flattens.

Text stays a raster area when it uses rich runs, decorations, paragraph styles, lists, text on a path, gradient or stroked paints, effects, non-Latin characters, or a face that is not one exact static TrueType file. Fonts that forbid embedding also stay raster. Tiled, adjusted, WebP, GIF and SVG images stay raster too. A font's tables only say a substitution or positioning rule might run, so any line they flag is drawn twice in the browser, as shaped text and as nominal glyph outlines, and compared cell by cell. A line that differs, such as Inter's raised colon in `10:30`, stays a raster area. The extra Helvetica text layer is only written for text that stayed raster. An image that the writer cannot embed flattens its page. Gradients, effects, blends and masks stay raster in place.

`tests/pdf-font-subset.test.ts` covers subsetting and placement. `tests/e2e/design-pdf-embed.spec.ts` exports through the dialog and checks the result with Poppler's `pdffonts`, `pdftotext`, `pdfimages` and `pdftoppm`.

`tests/design-pdf-vector.test.ts` covers page plans, paint order, raster fallbacks and merging, operators in the written stream, annotations, refused link schemes and the text layer. `tests/e2e/design-pdf-vector.spec.ts` exports through the dialog, then reads the result with PDF.js to check rendered pixels, link URLs and extracted text. No external PDF viewer or native build was checked.
