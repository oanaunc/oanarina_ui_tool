# SVG and visibility export controls

Unreleased source after dev.12; no app, installer, download archive or website deployment is produced by this work.

Saved layer export profiles now include optional `svg`, `includeHidden` and `includeOverlaps` fields. Old profiles and version-one/two projects remain readable. Profile edits use the existing validated Undo/Redo and instance-override paths. Invalid flags or SVG settings are rejected before import/store/MCP mutation. The editable Figma Bridge preflights them and continues to report export profiles as omitted; its API mock checks are not a desktop round trip.

SVG profiles expose these controls in the inspector and Export dialog:

- **Text geometry** keeps displayed geometry by default, including valid imported glyph outlines. **Editable SVG text** renders original text as `<text>`/`<tspan>`, with available font embedding, character formatting and hyperlinks. It leaves the saved text/outline untouched. Rebuilding text can differ from imported glyph positions or unavailable fonts. Generating new glyph outlines is a separate unfinished requirement.
- **Include SVG layer IDs** adds stable XML IDs encoded from each layer's UTF-8 identifier. Resource IDs/URLs remain intact, and repeated render copies receive distinct suffixes.
- **Preserve presentation attributes** retains the normal SVG fill/stroke/font attributes. Turning it off writes compatible presentation properties as inline styles, preserving existing inline precedence. Font-family, geometry, transforms, clipping, links and resource references remain attributes. Values unsafe to combine into CSS declarations remain attributes too. This prevents semicolons in imported names/identifiers from becoming new CSS declarations.

**Include hidden layers** creates a visible export snapshot without changing any stored visibility or opacity. Hidden ancestors are included when needed. It applies to SVG, PNG and JPG. The local Preferences toggle **Export hidden layers by default** supplies the choice for old/unset profiles and combined exports; a saved explicit profile choice takes precedence. Existing preferences migrate with this toggle off and retain their other values.

For **frame bounds**, **Include overlapping page layers** crops the page's paint stack into the transformed frame rectangle instead of isolating the frame subtree. Ancestor masks/clips are retained. It does not apply to artwork bounds; slices retain their existing overlapping-page crop behavior. Bounds for complex clipped text/masks retain their documented conservative limits. Export checks composed transforms and a maximum of 256 ancestor levels before recursively rendering SVG.

Combined exports expose the same SVG/visibility controls as local dialog choices, without changing document history. Saved and combined jobs capture their artwork/options before asynchronous encoding. Batch delivery consumes saved profiles normally.

**Copy selection as SVG** is reachable in Export. It copies the current selection's appearance independently of profiles, as plain SVG XML in the browser. On Mac, it reuses trusted `copy` authorization and the existing fixed `nodes`/`svg`/`text` representations, with SVG XML as plain text and editable Forma data retained. Successful current-document copies retain dependency provenance, so pasting an instance reuses its existing main. Copy is read-only, bounded to the existing 20 MB limit, and reports clipboard failures. No native IPC permission or representation was added; a new native clipboard acceptance run is deferred under the build freeze.

Source validation: 891 core tests in 83 files, editor/MCP TypeScript checks, 40 MCP source/protocol tests, 19 SVG/export browser checks, followed by all eight new SVG checks after the clipboard-provenance and safe-CSS refinements. Tests verify real PNG/SVG pixels, gradients/clips/strokes, profile Undo/reopen, hidden visibility independence, typed import refusal, inline precedence, stable XML IDs, legal ampersand font names, actual trusted browser actions and the fixed Mac bridge contract. No exact Figma or packaged/native acceptance is claimed.
