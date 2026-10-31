# Text direction workflows

This increment adds real layer and paragraph writing direction with mixed-script rendering. It does not reverse source strings, substitute visual-order text, alter UTF-16 offsets, bundle fonts or claim a finished Figma clone. No native app, package/archive, version, website or feature-register output changed.

## Editing and persistence

The additive optional `textDirection` accepts `auto`, `ltr` or `rtl` on text layers and paragraph overrides. Missing layer metadata defaults to Auto. In Rich text **All** or **Paragraphs**, **Layer writing direction** changes the default; **Selected paragraphs → Direction** overrides touched paragraphs. Clearing paragraph overrides restores inheritance. Auto resolves the first strong character of the full paragraph once, so wrapped lines beginning with Latin text do not accidentally change a Hebrew/Arabic paragraph's base direction.

Both controls use shared history and persisted document metadata. They refuse inherited locks, Motion and changed editor contexts. Character ranges, paragraph starts and clipboard offsets remain logical UTF-16 offsets; text and inline formatting are unchanged by a direction edit. Paragraph clipboard captures the resolved inherited direction, and text splices rebase the original paragraph identities. Node clipboard, components/instance overrides, local text styles and MCP transactions carry the field. New invalid directions or direction metadata on a non-text layer refuse loading/transactions before document mutation. Applying a plain/legacy text style restores Auto, rather than retaining a previous explicit direction. Direction edits invalidate preserved text outlines.

The source textareas use native layer-level direction and browser input behavior. Per-paragraph overrides are represented by the document canvas/prototype/export; the source textarea is not a custom per-paragraph rich contenteditable widget.

## Shared layout and rendering

Each shared `TextLine` records resolved direction, physical left inset and physical right inset. Paragraph/list indents occupy the logical leading side. Existing Left and Right controls remain physical alignment choices: setting RTL does not silently change Left into Right. SVG text-anchor mapping accounts for direction; center/justify use the actual available line box.

Each SVG line isolates its resolved base direction while retaining all source runs in logical order. The Unicode algorithm resolves a whole paragraph before cutting lines, but each SVG line is shaped alone, so a soft wrap would otherwise lose context. `bidiLineContext` restores it with invisible marks: open embeddings and isolates are reopened at the line start, and a line that starts or ends on a weak or neutral character gets a mark for the strong neighbour it had in the paragraph, including Arabic number context. Latin-only paragraphs get no marks. The source text and its offsets never change. On justified lines the marks sit outside the `textLength` span. The browser's Unicode bidi and shaping implementation orders Hebrew/Arabic, Latin text, digits, punctuation and styled spans. Arabic joining across color-run boundaries remains browser-shaped. Font metrics measure with the same direction; existing OpenType/axis probes also use it. Wrapped lines keep their paragraph's base direction. The shared Artwork path is consumed by canvas, prototype, SVG/raster export, masks and raster design-PDF delivery.

RTL lists place a separately isolated LTR decimal marker to the right of body ink and reserve a right-side gutter. Hanging wrapped lines retain that gutter; non-hanging wrapped lines retain the existing level indentation behavior. Decimal markers stay `12.` rather than reversing digits. Logical-end truncation retains source order and produces a visually trailing ellipsis in RTL. Auto-width measures body ink plus either side's inset instead of retaining an old layer width. Glyph ink can have normal italic overhang beyond its aligned advance box.

In the browser, a hidden `dir=auto` bidi element provides the engine's first-strong direction oracle. Its cache is bounded to 2,048 paragraph strings of at most 2,048 UTF-16 units each. Headless operation classifies strong letters from Unicode script properties across the right-to-left scripts, plus LRM/RLM/Arabic Letter Mark, and falls back to LTR. Headless widths retain the pre-existing approximate font metrics when no shaping engine is available. Explicit LTR/RTL is deterministic in both environments. Font availability still affects glyphs and measurements; UI22-038 multilingual fallback is unchanged and not claimed by this work.

## Interchange and inspection

Static SVG records direction and bidi isolation while keeping editable source runs. CSS inspection emits an explicit `direction` for forced direction and warns when Auto cannot be represented by one CSS rule; paragraph overrides already produce the shared one-rule omission warning. Editable Figma Bridge validates optional directions and explicitly reports their omission, including existing paragraph-specific formatting warnings. It does not claim native direction preservation or a direct binary `.fig` roundtrip. Browser-rendered SVG preserves appearance. Bridge API mock checks are implementation evidence, not a real Figma desktop reference roundtrip.

## Limits and status recommendations

This supports real mixed RTL/LTR paragraphs, physical alignment, rich spans, wrapping, right-side list markers and ellipsis. Wrapping retains the existing whitespace/grapheme strategy; it is not a complete Unicode line-break/dictionary implementation. Each wrapped SVG line has a separate bidi isolation boundary, so arbitrary explicit embedding/isolate controls and weak/neutral resolution context spanning multiple wrapped lines are not promised full paragraph-level UAX9 parity. Headless automatic direction is approximate for less common scripts and directional-control sequences. Native WKWebView visual reference checks were not run under the source-only freeze.

Recommend UI22-037 **implemented** for explicit/inherited RTL paragraphs, with reference verification pending. UI22-036 has substantial mixed-direction behavior but should remain **partial** if its full-parity scope includes arbitrary cross-line embedding controls, complete Unicode line breaking or headless shaping. UI22-038 remains unchanged. No claim is made that source rendering matches every Figma script/font/platform combination.

## Validation

Nine core cases cover automatic/forced direction, physical anchors, RTL indents, wrapped Auto, markers/ellipsis, logical UTF-16 paragraph/clipboard rebasing, validation/Undo/save, real generated component inheritance/style reset, auto-width and Bridge preflight/omission. Source MCP tests verify atomic refusal and Undo. Browser cases assert actual glyph start positions across mixed styled Hebrew/Latin/digit runs, physical alignment and exported colored pixels, full-paragraph Auto across Latin-leading wraps, RTL decimal marker order/right gutters, visually trailing ellipsis, reachable controls/clipboard/Undo/reopen and locks/Motion. Arabic color-boundary shaping is checked by equal exported alpha masks; justified RTL wrapped lines fill their measured boxes. Existing paragraph, emoji, accessibility, pixel leading, smart punctuation, type tabs and background suites also pass.

Inline canvas editing also applies the layer direction and uses plaintext paragraph direction for Auto. Native textareas provide one base direction; individual paragraph overrides remain visible in the shared artwork renderer rather than separate styled native editing blocks.

## Editing, caret and selection

Text editing stays in native textareas, so caret movement, selection and typing come from the browser. Arabic and Hebrew mixed with Latin were tested in Chromium: arrow keys walk the whole source, Shift-selection gives logical ranges, typing lands at the logical caret, and formatting keeps source order. Chromium's arrow keys follow the base direction, so Left moves forward in an RTL paragraph. Per-paragraph direction overrides still show in the canvas and exports, not in the textarea, which has one layer-level direction.

`tests/e2e/bidi-editing.spec.ts` compares second-line glyph order with the browser's own layout of the whole paragraph, for Latin in RTL, Hebrew in LTR, digits after Arabic and an embedding across a wrap. It also shows that removing the marks breaks that comparison. WKWebView caret behavior has not been run.
