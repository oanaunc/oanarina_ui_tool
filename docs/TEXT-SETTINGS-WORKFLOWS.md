# Text settings workflows

This source increment implements live smart punctuation, organized type settings and solid whole-layer text backgrounds. It does not add packages, native binaries, generated archives, versions, website changes or a claim of complete Figma parity.

## Smart quotes and symbol substitution

In **Rich text → All** or **Text information**, enable **Smart quotes and symbols while typing**. This is a validated local device preference (`smartTextSubstitution`, default false), outside `.oui` files. Existing preferences migrate with the new toggle disabled, retaining previous values.

The rich-text editor substitutes only one-character `insertText` insertions at a caret. It uses a bounded English punctuation heuristic: straight double quotes become opening/closing curly quotes, straight single quotes become opening/closing single quotes or apostrophes, `...` becomes `…`, `--` becomes `—`, and `(c)`, `(r)`, `(tm)` become `©`, `®`, `™` (case insensitive). Opening quotes follow whitespace, an opening bracket or the beginning of text; otherwise closing quotes are used. These are real source Unicode characters supported by the existing font, layout, render, clipboard and export paths.

Substitution replaces only the completed token, preserves the token's first character overrides and rebases later character ranges and paragraph identities. Incremental draft patches retain that formatting rather than reconstructing it from only the final string. The caret is restored synchronously after the controlled text update, so rapid following keystrokes cannot be inserted at an obsolete cursor. Committing the editor produces a single document history operation for the typing session; substitution does not add a second Undo operation. Emoji, paragraph/range formatting and rich clipboard consume the same pending draft metadata.

Bulk input, replacement of a selected range, paste/drop, file import, deletion and composition retain their literal source. Composition suppression also covers its completion frame. Existing text is never scanned or rewritten simply by enabling the toggle. The ordinary Typography textarea does not perform these substitutions. Document, page, selection, mode, modal, home, Motion/time and UI visibility changes discard a stale pending rich-text draft; inherited locks and Motion refuse text changes. A draft is not written into a newly imported document or a newly selected layer.

This is an opt-in English editor feature, not macOS system text replacement, spellcheck, language-aware typography or an arbitrary/custom shortcut dictionary. It does not infer code/URLs, support every locale's quote conventions, or offer every symbol shortcut. Disable it when literal straight punctuation is wanted. UI22-041 has a real reachable implementation within these explicit limits; reference parity remains unverified.

## Type settings tabs

The rich-text inspector has **All**, **Characters**, **Paragraphs**, **OpenType**, and **Text information** tabs. All remains the initial compatibility view. The text editor, character selection indicator, emoji controls and clipboard preference stay available above/below the tabbed settings.

Characters exposes real range font, weight, position, capitalization, color, hyperlink and underline controls. Paragraphs exposes line-height units, paragraph alignment/spacing, indentation and lists. OpenType exposes the existing validated font axes and OpenType feature inputs. Text information exposes accessibility description, the whole-layer background and smart punctuation preference. Font-specific settings still depend on font support and retain the existing explicit editable Figma omissions.

The tabs support roving focus with Left/Right/Home/End keys and have associated tab/tabpanel semantics. Switching tabs preserves the text selection and commits a focused field through its normal blur path. Panel fields remount when their target layer changes, preventing equal-valued sibling targets from reusing an old numeric/text draft. Tabs are editor UI state, not document content, and do not change history or saved files. UI22-054 is implemented as an organization of working controls, without claiming an exact Figma settings layout.

## Whole-layer text background

Enable **Fill text-layer bounds** in All/Text information and choose a solid six-digit hex color. The additive optional `textBackground` field applies only to text layers and is validated on load/transactions, component data and Bridge preflight. Missing metadata preserves old document rendering.

Shared Artwork renders an actual rectangle behind the text-layer bounds, before glyph clipping and underneath glyph paints/strokes. It follows the current width/height, including text auto-size, layer/ancestor transforms, flips, opacity, effects and ancestor clipping. It participates in alpha/luminance mask sources at its real color and in vector mask sources as opaque white geometry. Outline/mask-inspection views draw its perimeter using the corresponding existing outline palette. Static SVG, raster, design-PDF raster pipelines and prototype rendering share the same artwork consumer. No layout size/padding is added by the background.

Background color edits use document history, persist in `.oui` and node clipboard, inherit through components/instance overrides, are included in local text styles, and support MCP transactions. Applying an old/plain text style clears a consumer's previous background. Character-only clipboard fragments intentionally do not transfer this layer-level attribute. CSS inspection includes the background color. Imported invalid/background-on-nontext metadata refuses the transaction before mutation. UI controls recheck editor context and inherited locks; Motion disables document background changes.

Editable Figma Bridge transfer validates then explicitly reports omission of the whole-layer background; it does not silently replace editable text with an extra wrapper. SVG transfer/export preserves actual appearance. Mock public API tests are implementation evidence, not a real desktop plugin roundtrip.

This is a solid rectangular whole-layer background. It is not per-character/range highlighting, automatic per-line highlight boxes, a background paint stack, independently rounded corners, background-only opacity or padding. UI21-029 is implemented for a whole text layer; those separate enhancements remain absent. UI22-026 selection-color display is not changed by this increment.

## Verification

Core tests cover actual Unicode source substitutions, disabled/bulk/IME/delete exclusions, token-first styles and UTF-16/paragraph rebasing, local preference migration, optional background validation and atomic refusal, shared Undo, real SVG structure/mask coverage, local style resets, component inheritance and Bridge validation/omissions. MCP checks cover file persistence, atomic refusal and Undo. Browser checks exercise rapid typing with a single history commit, `.oui` reopening, actual rich runs/paragraph offsets, literal paste/composition/import, Motion/locks/stale drafts, tab editing/keyboard navigation, background controls/Undo and raster pixels under glyph clipping, transforms, opacity and alpha/vector/luminance masks. Existing emoji/line-height/accessibility/paragraph interaction suites also pass.

## Letter case

**Letter case** offers As typed, Uppercase, Lowercase and Title case, for a layer under Character variants and for a selected range under Characters. The Text menu's Uppercase, Lowercase and Title case set the same field on selected layers, and choosing the one already set turns it off. It is the optional `textCase` field, in text styles too, so the stored characters stay as typed and turning it off gives them back. Search, replace and the copied text work on what was typed. The canvas, the editor, SVG, PDF and raster export show the case. CSS and site export write `text-transform`, PowerPoint writes all caps as its own setting and the shown characters for the others, and native code snippets write the shown characters. Title case raises the first letter of each word and leaves the rest, as CSS capitalize does. A character whose case changes its length, such as ß, counts as one caret stop.
