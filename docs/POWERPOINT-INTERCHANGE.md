# PowerPoint interchange

Slides writes and reads `.pptx` files directly, with `fflate` for the package and a strict bounded XML parser of its own. This is a stated subset, not full PowerPoint fidelity. Nothing leaves the device, and no PowerPoint installation is needed.

## Export

**Export PowerPoint** in the Slides inspector or the export dialog writes a complete OOXML package: content types, relationships, presentation, theme, one slide master and layout, every slide, and notes parts when a slide has notes. Each slide is sized in EMU at 9,525 per pixel.

| Forma | PowerPoint |
| --- | --- |
| Slide size, name, background color, hidden state | `sldSz`, `cSld name`, `bgPr`, `show="0"` |
| Fade and slide-in transitions | `p:fade` and `p:push`, with speed bucketed to fast, medium or slow |
| Speaker notes | Notes slide body |
| Text: family, size, bold, italic, underline, strike, color, spacing, alignment, line height, bullets, numbering, hyperlinks, styled ranges | Text box with real runs |
| Rectangles, rounded rectangles, ellipses | Preset geometry |
| Paths, polygons, stars | Custom geometry with lines and cubics |
| Lines and arrows | Line preset with an end marker |
| One solid fill, one solid stroke, opacity, rotation, horizontal flip | `solidFill`, `a:ln`, alpha, `a:xfrm` |
| PNG, JPEG, GIF images with centered cover crops | `p:pic`, one media part per distinct image |
| WebP and SVG images | Converted to PNG in the browser |

Gradients, image paints on shapes, stacked paints, effects, masks, blending and text on a path are flattened to PNG pictures at up to 2× so they look right but stop being editable. Without a browser renderer they are omitted, and the export reports that. Every flatten or omission appears in a notice after export. Video exports as its poster, and playback is not written. Layers that sit outside a clipped frame are not clipped in PowerPoint, because the frame becomes a plain shape.

## Import

**Import PowerPoint…** appends slides to the open deck in one Undo step. Slides scale uniformly into the deck and stay centered, so a different aspect ratio is letterboxed. The whole file is read and validated before the deck changes, so a failed import leaves it untouched.

The reader follows relationships from the package root. It resolves placeholder position, text defaults, theme colors, luminance changes, theme fonts and backgrounds through the slide, layout and master. It shows master and layout artwork, applies group transforms including rotation and flips, and uses the `mc:Fallback` branch of alternate content.

It reads text boxes and their runs, the preset shapes above plus 16 common presets such as arrows, stars and polygons, custom geometry, lines and connectors as straight lines, embedded PNG/JPEG/GIF pictures, tables as editable rectangles and text, notes, hidden slides and transitions.

These are reported in a notice rather than failing the import:

- Charts, SmartArt, embedded objects and ink are omitted. Audio and video keep only their poster picture.
- EMF, WMF, TIFF and other picture formats are omitted.
- Linked pictures are never fetched and are omitted. Hyperlinks stay as text links.
- Gradients become their first color. Pattern and picture fills are dropped.
- Unlisted preset shapes keep their rectangular bounds. Arc segments in custom geometry become short straight lines.
- Off-center picture crops become centered crops. Rotated or vertical text boxes read as horizontal.
- Merged table cells keep their first cell's size. Animations are ignored and macros are never run.

## Limits and safety

The reader takes files up to 200 MB, 20,000 parts, 500 MB expanded, 64 MB per XML part, 20 MB per picture, 500 slides and 5,000 shapes per slide. The expansion limit uses the archive's declared sizes before any part is inflated. The result must also fit the 50 MB project limit. The XML parser refuses document type declarations, custom entities, undeclared prefixes, mismatched tags and excessive depth, and relationships cannot point outside the package. Pictures are checked by their bytes, not their names, so a disguised file is refused. Password-protected presentations are not readable.

## Validation

`tests/pptx.test.ts` unzips real output and checks that every part is declared and reachable, that relationship targets exist, that presentation and slide children follow schema order, that shape IDs are unique and that text is escaped. It round trips text, runs, links, shapes, images, notes, hidden state and transitions through the writer and reader, then through `.oui` save and reopen. Handwritten foreign packages cover placeholder inheritance, theme colors, master shapes, group scaling, tables and alternate content. Refusal cases cover non-ZIP input, encrypted containers, malformed XML, a DOCTYPE entity, missing parts, relationships that escape the package, forged expansion sizes and disguised pictures.

`tests/e2e/slide-embeds.spec.ts` exports a real download, imports it back through the file control with Undo, flattens a shadowed layer to a decoded PNG, and refuses a corrupt file with the deck unchanged.

A generated sample also rendered correctly in macOS Quick Look, an independent Office parser, including rotation, alpha, styled runs and images. It has not been opened in PowerPoint or Keynote, so that round trip remains a pending check. No schema validation against the ECMA-376 XSDs has been run.
