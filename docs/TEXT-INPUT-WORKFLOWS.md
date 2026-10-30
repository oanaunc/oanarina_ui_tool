# Text input workflows

This source increment adds working paths to the shared editor. It does not claim full Figma typography parity, a native macOS emoji picker, or an exhaustive Unicode emoji catalog. No installer, generated bridge/MCP archive, version or website changed.

## Accessibility descriptions

Text layers have an optional, validated `textDescription` of at most 2,000 UTF-16 code units. Select a text layer and use **Rich text → Text accessibility → Description**. The field commits through document history, clears with whitespace-only input, survives `.oui` save/reopen, node clipboard, component synchronization/overrides and MCP transactions, and refuses inherited locks, Motion and stale editor targets.

The description does not replace visible text or its accessible name. `accessibilityLabel` remains the name when present; otherwise the source text (or layer name for empty text) supplies it. Shared Artwork emits escaped SVG `<desc>` and `aria-description` and makes described text an accessible image group. This works in the canvas, prototype and static SVG. Character-only rich clipboard does not transfer layer accessibility metadata. Editable Figma Bridge transfer explicitly reports that this description is omitted. It is preserved by SVG export; no real Figma desktop roundtrip was performed.

## Local emoji search and colon suggestions

**Insert emoji** opens a local searchable starter catalog of 81 emoji, including several variation-selector and ZWJ sequences. Search matches short codes and keywords. Selection replaces the saved character range, preserving its starting character style. A caret insertion inherits preceding formatting, using the existing rich-text insertion convention. Source Unicode, paragraph identities and UTF-16 range offsets persist through history, `.oui`, node/rich clipboard and MCP.

While the rich-text editor caret follows a whitespace-delimited token such as `:rocket`, matching buttons appear. Choose a button, or press Enter/Tab to accept the first match. Escape dismisses those suggestions until the caret or text changes. Composition suppresses acceptance. No source text is changed until a choice is made. URLs and interior-word colons do not trigger suggestions. Picker requests capture document, page, selection, mode, Motion state/time, modal and UI visibility; a changed context dismisses the request. Pending text is committed before picker capture. Locks are checked again at insertion.

This is a bounded starter implementation: it does not invoke the OS character viewer, cover all emoji names, supply arbitrary skin-tone/gender combinations, manage recents or support a configurable code dictionary. Emoji glyphs depend on installed/system fonts and export recipients' fonts. No proprietary/color emoji font is bundled. The existing font-loading/clipboard/SVG text pipeline receives the actual Unicode sequences.

## Line-height units

The optional `lineHeightPx` is an additive `.oui` v2 field. Absent metadata preserves the existing multiplier behavior byte-for-byte. The shared layout, canvas/prototype text, SVG/raster export and autoheight consumers read fixed pixels. Autoheight includes the full glyph envelope even when fixed line advances overlap. Text outlines invalidate when pixel leading changes. A unit control exposes multiplier, percent and fixed pixels; percent is a local display preference for the same relative multiplier. Pixel leading stays fixed when font size changes. Relative leading scales with each line's largest character size and retains the old minimum glyph-envelope rule; fixed pixels allow overlap.

Conversions use the layer's base font size, including when a line has differently sized rich runs. Entering or editing pixel mode stores a multiplier fallback snapshot (`px / base font size`). Later font-size edits keep both the fixed pixels and that last fallback snapshot; older app versions that do not understand `lineHeightPx` are not promised forward rendering fidelity. The control accepts positive values, at most 10,000 px and a conversion ratio of 100. The optional model field itself validates positive finite values through 10,000 px. Changing the existing Typography multiplier clears fixed mode. A manually edited relative paragraph multiplier also cancels inherited pixel leading for that paragraph; a fixed paragraph override takes precedence over inherited relative leading. Clearing all paragraph overrides restores the layer mode. Paragraph clipboard copies the resolved mode instead of accidentally inheriting fixed leading into a relative override.

Fixed leading carries through local text styles, instances/overrides, node/rich clipboard and MCP. Applying a relative local text style clears a consumer's previous pixel leading. Dev CSS reports pixel values. Figma Bridge preflights fixed values, maps base/linked text leading to the public `PIXELS` API and reads that API back into optional metadata. Paragraph-specific formatting still uses the pre-existing explicit Bridge omission. Mock API checks are implementation evidence, not desktop reference verification.

Each fixed line occupies a fixed top-to-top advance; the actual baseline within it follows the line's largest glyph metrics. Rich lines with varying font sizes can therefore have different baseline gaps. Exact Figma/OpenType typography parity, automatic line height and all Figma type-settings tabs are outside this increment.

## Validation

Meaningful core checks cover bounded token/search behavior, Unicode/style/paragraph preservation, plain-text validation/locks, SVG escaping, component synchronization/Undo, fixed and relative layout/overlap bounds, style mode clearing, Bridge refusal/mapping and linked overrides. MCP checks verify atomic refusal and Undo. Browser checks exercise accessible name/description, real picker and keyboard completion, cancellation, stale targets, unit conversion, glyph baselines/pixels, HTML clipboard and saved reopening. Source was frozen during browser runs.

Status recommendations: UI22-040 implemented (reference verification pending); UI22-035 and UI22-042 partial with the catalog/OS limits above; UI22-055 implemented for multiplier/percent/fixed-pixel conversion (automatic mode and exact variable-rich-line parity are limits); UI22-054 remains planned.
