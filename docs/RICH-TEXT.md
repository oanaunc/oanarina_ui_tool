# Rich text and character formatting

Oanarina UI Tool supports persistent character formatting in normal text layers in Design, Whiteboard, and Slides documents. This is a local editor capability; it does not establish full Figma typography or file-interchange parity.

## Editing

Select a text layer, open **Character formatting**, and select characters in the **Rich text content** editor. The selected UTF-16 character interval appears below the editor. Bold, italic, underline, strikethrough, family, size, numeric weight, tracking, color, and an http/https link apply to that interval. Mixed selected values are reported explicitly. Clearing selected formatting removes overrides and restores the layer's base properties. A caret alone does not create a pending typing style.

The inspector's **Open selected link** action opens a uniform selected link. Prototype presentation opens the link on the clicked character range, falling back to the layer link. An explicit prototype reaction on the text layer takes priority. SVG exports contain range anchors. Text links are not automatically opened when selecting artwork in the editor.

The expandable controls accept four-character font axis tags and numeric values, such as `wght=650, wdth=110`, and OpenType tags such as `liga=0, tnum=1`. These are actual CSS font-variation/feature settings used in rendering and measurement. The font must contain the requested axis/feature. Google catalog downloads currently request weight and italic faces; an arbitrary axis entered here does not cause a font download with that axis. Imported or bundled variable fonts can expose additional axes when present in their files.

Underline appearance exposes solid, double, dotted, dashed and wavy styles, numeric thickness and offset, color, and skip-ink. Browser rendering was visually checked with a wavy underline. Native WKWebView and external SVG viewers may differ in decoration rendering; these settings require renderer-specific checking before claiming identical appearance everywhere.

Character changes use the document's normal undo history and `.oui` persistence. Ordinary text editing, component property changes, variables and whiteboard-generated text reconcile offsets rather than leaving stale ranges. Range editing currently lives in the inspector; the canvas's inline editor remains plain text. Inline browser textarea shortcuts are not a complete Figma range-formatting shortcut system.

## Clipboard and fonts

Copy/cut/paste in the range editor writes plain text, supported HTML and an `application/x-oanarina-rich-text` payload. A paste prefers the validated custom payload, then supported HTML, then plain text. **Paste without formatting** uses only plain content and the insertion point's existing style. External HTML recognizes supported semantic and inline styles, including links, axes, features and underline appearance. Script and media elements are discarded; markup is parsed in an inert detached template, never mounted in the page. Unsupported CSS and paragraph structures are not preserved.

Font collection uses the exact text assigned to each base/run face and uses the effective `wght` and `ital` settings. A fully replaced base family is not included solely because it remains on the layer. Used face assets are embedded through the existing export path. Font replacement covers run family overrides. Reusable local text styles capture and apply base axes, features and underline settings; content-dependent run offsets are intentionally not stored as a generic text style.

## Document model and validation

The additive fields keep existing version-one and version-two documents readable:

- `DesignNode.textRuns?: TextRun[]` stores sparse ordered non-overlapping `[start, end)` UTF-16 intervals. Each entry carries only its character overrides.
- `fontAxes`, `fontFeatures`, and `underline` are optional base text properties as well as run overrides.
- Runs resolve against the layer's base text style. Adjacent equal overrides are compacted. Insertions inherit the preceding character override unless an explicit rich fragment supplies its own styles.

Imported runs are checked before mutation: interval bounds/order, surrogate-pair boundaries, supported font/style fields, finite bounded numbers, safe colors, http/https links, four-character axis/feature tags, bounded integer feature values, and complete bounded underline values. A maximum of 10,000 ranges and a five-megabyte rich clipboard payload limit avoid unbounded data. Sparse runs preserve plain gaps during HTML serialization.

Text wrapping retains run boundaries, measures each effective face and font size, and uses the largest run size on a line for line metrics. Long-word breaks and ellipsis use grapheme boundaries. Headless tests use approximate font metrics; browser measurement uses actual available fonts and a detached measurement span for variation/features. This is not a full paragraph shaping engine.

## Evidence and limits

`tests/rich-text.test.ts` covers split/merge/clear, mixed values, insert/delete/reconciliation, surrogate safety, strict import, font requests, clipboard serialization, SVG attributes/anchors, mixed-size metrics, grapheme truncation, local text style integration, undo and persistence. `tests/rich-text-review.test.ts` independently checks formatted whiteboard text after derived updates. Together with existing layout and design-system tests, the focused run passed **47 tests**.

`tests/e2e/rich-text.spec.ts` and `tests/e2e/rich-text-review.spec.ts` passed **seven browser interaction checks**: actual selected range styling/rendering, ordinary edits with undo, rich/plain clipboard, sanitized HTML, external HTML axes/feature/underline round trip, inherited CSS resets, and per-range prototype links with explicit reaction priority. `build/screenshots/dev-rich-text.png` is an app-generated synthetic example, not a Figma reference capture. TypeScript validation passed after the code changes.

Remaining limits include paragraph-specific ranges, nested lists, fully controlled bidirectional/RTL paragraphs, text-on-curve, baseline shifts/superscript/subscript, feature discovery and preview, automatic axis discovery, font-specific style menus, balanced wrapping, hanging punctuation, vertical trim, complete inline canvas range editing, full mixed fill/stroke/effect stacks per character, and text shaping parity with Figma. Custom local range data persists in `.oui`; the Figma plugin currently transfers base typography and does not implement a tested native mixed-run/axis round trip. SVG preserves visible range attributes and anchors, but importing an SVG in another editor may outline or simplify its text. No direct binary `.fig` support is claimed.
