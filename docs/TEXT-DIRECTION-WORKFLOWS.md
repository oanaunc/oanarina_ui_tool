# Text direction workflows

This increment adds real layer and paragraph writing direction with mixed-script rendering. It does not reverse source strings, substitute visual-order text, alter UTF-16 offsets, bundle fonts or claim a finished Figma clone. No native app, package/archive, version, website or feature-register output changed.

## Editing and persistence

The additive optional `textDirection` accepts `auto`, `ltr` or `rtl` on text layers and paragraph overrides. Missing layer metadata defaults to Auto. In Rich text **All** or **Paragraphs**, **Layer writing direction** changes the default; **Selected paragraphs → Direction** overrides touched paragraphs. Clearing paragraph overrides restores inheritance. Auto resolves the first strong character of the full paragraph once, so wrapped lines beginning with Latin text do not accidentally change a Hebrew/Arabic paragraph's base direction.

Both controls use shared history and persisted document metadata. They refuse inherited locks, Motion and changed editor contexts. Character ranges, paragraph starts and clipboard offsets remain logical UTF-16 offsets; text and inline formatting are unchanged by a direction edit. Paragraph clipboard captures the resolved inherited direction, and text splices rebase the original paragraph identities. Node clipboard, components/instance overrides, local text styles and MCP transactions carry the field. New invalid directions or direction metadata on a non-text layer refuse loading/transactions before document mutation. Applying a plain/legacy text style restores Auto, rather than retaining a previous explicit direction. Direction edits invalidate preserved text outlines.

The source textareas use native layer-level direction and browser input behavior. Per-paragraph overrides are represented by the document canvas/prototype/export; the source textarea is not a custom per-paragraph rich contenteditable widget.

## Shared layout and rendering

Each shared `TextLine` records resolved direction, physical left inset and physical right inset. Paragraph/list indents occupy the logical leading side. Existing Left and Right controls remain physical alignment choices: setting RTL does not silently change Left into Right. SVG text-anchor mapping accounts for direction; center/justify use the actual available line box.

Each SVG line isolates its resolved base direction while retaining all source runs in logical order. The browser's Unicode bidi and shaping implementation orders Hebrew/Arabic, Latin text, digits, punctuation and styled spans. Arabic joining across color-run boundaries remains browser-shaped. Font metrics measure with the same direction; existing OpenType/axis probes also use it. Wrapped lines keep their paragraph's base direction. The shared Artwork path is consumed by canvas, prototype, SVG/raster export, masks and raster design-PDF delivery.

RTL lists place a separately isolated LTR decimal marker to the right of body ink and reserve a right-side gutter. Hanging wrapped lines retain that gutter; non-hanging wrapped lines retain the existing level indentation behavior. Decimal markers stay `12.` rather than reversing digits. Logical-end truncation retains source order and produces a visually trailing ellipsis in RTL. Auto-width measures body ink plus either side's inset instead of retaining an old layer width. Glyph ink can have normal italic overhang beyond its aligned advance box.

In the browser, a hidden `dir=auto` bidi element provides the engine's first-strong direction oracle. Its cache is bounded to 2,048 paragraph strings of at most 2,048 UTF-16 units each. Headless operation uses a documented approximation: common RTL script letter ranges plus LRM/RLM/Arabic Letter Mark, ignoring ordinary neutral punctuation/digits and falling back to LTR. Headless widths retain the pre-existing approximate font metrics when no shaping engine is available. Explicit LTR/RTL is deterministic in both environments. Font availability still affects glyphs and measurements; UI22-038 multilingual fallback is unchanged and not claimed by this work.

## Interchange and inspection

Static SVG records direction and bidi isolation while keeping editable source runs. CSS inspection emits an explicit `direction` for forced direction and warns when Auto cannot be represented by one CSS rule; paragraph overrides already produce the shared one-rule omission warning. Editable Figma Bridge validates optional directions and explicitly reports their omission, including existing paragraph-specific formatting warnings. It does not claim native direction preservation or a direct binary `.fig` roundtrip. Browser-rendered SVG preserves appearance. Bridge API mock checks are implementation evidence, not a real Figma desktop reference roundtrip.

## Limits and status recommendations

This supports real mixed RTL/LTR paragraphs, physical alignment, rich spans, wrapping, right-side list markers and ellipsis. Wrapping retains the existing whitespace/grapheme strategy; it is not a complete Unicode line-break/dictionary implementation. Each wrapped SVG line has a separate bidi isolation boundary, so arbitrary explicit embedding/isolate controls and weak/neutral resolution context spanning multiple wrapped lines are not promised full paragraph-level UAX9 parity. Headless automatic direction is approximate for less common scripts and directional-control sequences. Native WKWebView visual reference checks were not run under the source-only freeze.

Recommend UI22-037 **implemented** for explicit/inherited RTL paragraphs, with reference verification pending. UI22-036 has substantial mixed-direction behavior but should remain **partial** if its full-parity scope includes arbitrary cross-line embedding controls, complete Unicode line breaking or headless shaping. UI22-038 remains unchanged. No claim is made that source rendering matches every Figma script/font/platform combination.

## Validation

Nine core cases cover automatic/forced direction, physical anchors, RTL indents, wrapped Auto, markers/ellipsis, logical UTF-16 paragraph/clipboard rebasing, validation/Undo/save, real generated component inheritance/style reset, auto-width and Bridge preflight/omission. Source MCP tests verify atomic refusal and Undo. Browser cases assert actual glyph start positions across mixed styled Hebrew/Latin/digit runs, physical alignment and exported colored pixels, full-paragraph Auto across Latin-leading wraps, RTL decimal marker order/right gutters, visually trailing ellipsis, reachable controls/clipboard/Undo/reopen and locks/Motion. Arabic color-boundary shaping is checked by equal exported alpha masks; justified RTL wrapped lines fill their measured boxes. Existing paragraph, emoji, accessibility, pixel leading, smart punctuation, type tabs and background suites also pass.
