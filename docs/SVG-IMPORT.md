# Editable SVG import

The development source imports a supported SVG subset as editable document layers. It does not add binary `.fig` access or establish complete Figma SVG/interchange parity. SVGs exported by Figma may contain features outside this subset; the Figma Bridge remains a separate transfer route.

## Import and review

Choose **File → Place image or SVG**, or drop an SVG onto the Design/Whiteboard canvas. The **Import SVG** dialog shows a preview of the supported editable result, layer count, viewport dimensions and any reductions. Nothing is added until a choice is confirmed:

- **Import editable layers** adds a named root frame, groups and editable shapes, paths, text or embedded raster layers. The root is selected and fitted to the canvas. The whole import is one Undo action, and normal editing and `.oui` persistence apply afterward.
- **Import sanitized visual asset** keeps the older single-image route. This strips active content, external resources, inline style declarations and unsupported markup. It can change appearance and is not an exact rendering guarantee. The visual layer can be transformed, but its internal SVG elements are not individual editor layers.
- **Cancel SVG import** leaves the document unchanged. Escape or closing the dialog also cancels that file.

Editable parsing errors leave the visual choice available. Both routes independently validate their input and the combined destination document before mutation. An invalid/unsafe SVG can fail both choices; the error stays in the dialog and no partial document is added. Loading a different project cancels a pending request. Several selected files are reviewed sequentially.

The Slides image placement control currently accepts raster images. Editable SVG placement through that control is not implemented.

## Supported editable content

- **Rectangles and rounded rectangles, circles/ellipses, lines, polylines, polygons and paths.** Rectangles/ellipses retain native shape controls when the affine transform permits it. Other geometry, skewed shapes and elliptical corners become ordinary editable paths, including cubic curves derived from SVG arcs/quadratics. Compound even-odd geometry is reoriented for the editor's nonzero path fill renderer.
- **Groups, names and hierarchy.** IDs, `data-name`, Inkscape labels and title elements supply names. Node IDs are newly generated. Group opacity is kept on the group so overlapping children composite together. `display` and inherited `visibility` are handled separately.
- **Transforms and viewports.** Matrix, translate, scale, rotate and skew lists compose in SVG order. Nested transforms are baked into leaf coordinates while ordinary groups retain hierarchy. `viewBox` origins and `preserveAspectRatio` meet/slice/none map the viewport. Nested SVG and symbol viewports map coordinates, with an explicit notice for unsupported nested viewport clipping. Absolute CSS units, percentages and font-relative units have bounded numeric parsing. Root percentages use the viewBox or standard fallback dimensions, with a notice because no external embedding viewport is available.
- **Presentation attributes, inline styles and stylesheets.** Supported properties include fill, stroke, alpha, currentColor, opacity, visibility, font properties, tracking, anchors, decorations and `mix-blend-mode`. `<style>` rules apply through type, class, id, attribute, descendant and child selectors, with specificity, source order and `!important`, under inline style as in a browser. Pseudo selectors, at-rules and imports are reported and never applied or fetched. Colors support hex, RGB(A), HSL(A) and every CSS color name. Unknown colors/properties are reported.
- **Strokes.** Width, opacity, cap, join, miter limit, dash arrays/offset and non-scaling strokes map to editable stroke data. Odd-length dash patterns are repeated as SVG specifies. Negative dash values are rejected. Nonuniform stroke transforms use an explicitly reported geometric-mean width approximation.
- **Text.** Plain text and tspan formatting become normal text layers with character runs. Explicit x/y/dx/dy positions create separately editable chunks; supported inline changes retain font, weight, size, italic, solid color and decoration. Baselines account for the largest size in a chunk. HTTP(S) text links survive nested spans and SVG export. Anchors use the measured text width. Bounds depend on the fonts available during import; headless measurement is approximate, and later font substitution can change appearance.
- **Local use/symbol references.** Local IDs expand into independent editable nodes. Symbol viewBoxes and use width/height are mapped. Missing, external, cyclic or excessively deep references are refused or reported. No URL is fetched.
- **Selectors.** Stylesheets match structural pseudo classes (`:first-child`, `:last-child`, `:only-child`, the `-of-type` forms, `:nth-child`, `:nth-last-child`, `:nth-of-type`, `:nth-last-of-type`, `:not`, `:root`, `:empty`) and the `>`, `+` and `~` combinators. State a drawing never has (`:hover`, `:focus` and so on) simply never matches. Pseudo elements stay unsupported and are reported.
- **Markers.** `marker-start`, `marker-mid` and `marker-end` become editable layers at each vertex, with `orient`, `refX`, `refY`, `viewBox` and `markerUnits`. A marker's own viewport clip is not reproduced, and mid markers on arc segments also appear where the arc is divided, which is reported.
- **Radial focal points.** `fx` and `fy` stay as an additive focal point on the paint, drawn on the canvas and in SVG, raster and vector PDF exports. There is no handle for it yet; `fr` reduces to a point and the report says so.
- **Gradients.** Linear and radial gradients in either unit system, with `gradientTransform`, become editable paints placed through the element's transform into the layer's own box, so baked paths and rotated shapes agree. Stops and local gradient inheritance are retained. A diagonal linear gradient on a non-square layer is placed by its end points and its bands can tilt slightly; an ellipse that does not match the layer's proportions uses the nearest circle; both are reported. Repeat and reflect spread use pad. Radial focal offsets and gradients on text use the first stop, with a notice.
- **Filters.** The primitive chains design tools export become editable drop shadows, inner shadows and layer blurs, including spread, along with plain `feGaussianBlur` and `feDropShadow`. A chain with any other primitive is left out and reported, because a partial filter is neither the source look nor editable.
- **Image patterns.** A pattern holding one embedded image becomes an image fill, with its placement as a crop when the scale is uniform.
- **Embedded raster images.** Base64 PNG/JPEG/WebP/GIF payloads require a matching file signature and explicit positive dimensions. Supported rotation/scaling retains an image layer with centered fit/fill. Remote references, SVG-in-SVG images and skewed image transforms are omitted with notices. Non-centered alignment or forced stretching is reported as approximate.
- **Clips and masks.** A single unrotated rectangular clip becomes a clipping frame. Any other clip, including rotated, compound, circular, `objectBoundingBox` and `clip-rule` clips, becomes an editable vector mask source. `<mask>` becomes a luminance or alpha mask group whose artwork stays editable. Unequal rounded clip radii report a circular-corner approximation. Empty clips hide their target; negative dimensions/radii are rejected. A clip clipped by another clip uses its own shape only.

`complete: true` means the parser reported no known reductions for that input. It does not mean pixel-identical rendering, full SVG compliance, full Figma parity or completed reference verification.

## Explicit limits

Markers, multi-image and vector patterns, pseudo selectors, foreign HTML, animation, text length adjustment, arbitrary text-span transforms/opacity, full range visibility/alpha, bidi/vertical text, arbitrary variation/feature CSS and links around nontext artwork are not fully preserved. Unsupported behavior generates review notices when detected; unsupported elements can be omitted. Per-character coordinate lists become one text layer per character. `textPath` keeps its baseline when it is one open contour of up to 64 anchors in a file with no masks or clips; otherwise the characters stay as plain text at the start of the path, with a notice. SVG font fallback lists and text shaping are not a complete browser layout engine.

The visual route uses a conservative allowlist and strips all hrefs. It therefore also drops raster-image references, use references, links, inline styles and unsupported elements. Source SVGs containing those may look different even as a sanitized visual asset. Use original source tools to inspect anything omitted; imported content is never mounted as untrusted HTML.

## Validation and resource limits

`src/svg-import.ts` is a headless parser returning data only:

```ts
parseEditableSvg(raw, name?, {x?, y?})
// {nodes, rootId, width, height, issues: [{code, message, element?}], complete}
```

The XML parser is the MIT-licensed `@xmldom/xmldom` 0.9.12, verified against its official npm registry and maintainer repository. There are no network, filesystem or code-evaluation operations in the import parser. Custom DTDs/entities are rejected before XML parsing. SVG scripts, event handlers, external references and foreign content are never executed. Stylesheets are read by `src/svg-css.ts` as bounded text (2 MB, 5,000 rules); only allowlisted properties reach layer data.

The input is limited to 20 MB, 10,000 XML elements, 80 source nesting levels, 20,000 resulting layers per page, bounded local reference expansion, 100 transforms per list, 100 gradient stops, 100 dash entries, and finite coordinates within one million units. Path data has separate size/token bounds. Imported graphs pass the shared `.oui` validators; confirmation additionally validates the combined document before appending anything. Existing project size/schema limits still apply. Local source names/text are rendered through React, not HTML injection.

## Evidence and specification references

`tests/svg-import.test.ts` checks editable geometry/hierarchy/styles/text, affine composition and skew, viewport mappings, stroke dashes, even-odd holes, use/symbol expansion, gradient inheritance/reductions, actual Artwork SVG output, safe images, clipping, links, malformed XML/path/geometry rejection, references, and active-content refusal.

`tests/e2e/svg-import.spec.ts` exercises the real file picker and review dialog, checks sampled pixels between an original synthetic SVG and its exported result, edits an imported rectangle, uses Undo/Redo, saves/reloads `.oui`, reviews/cancels reductions, tests the sanitized visual route and Undo, and verifies that hostile content makes no source-specified requests or code execution. The DTD path fails safely without document mutation.

The implementation follows the W3C definitions for [coordinate systems/viewports/transforms](https://www.w3.org/TR/SVG/coords.html), [basic shapes](https://www.w3.org/TR/SVG/shapes.html), [text positioning](https://www.w3.org/TR/SVG/text.html), and [painting](https://www.w3.org/TR/SVG/painting.html). Parser API/security behavior is documented by [xmldom's maintainers](https://github.com/xmldom/xmldom). These primary references guide implementation; complete standards conformance and per-feature Figma reference verification remain ongoing.
