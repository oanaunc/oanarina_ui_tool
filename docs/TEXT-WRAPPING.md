# Balanced and pretty text wrapping

This source increment adds model-backed Normal, Balance and Pretty modes. It does not claim exact Figma or browser CSS algorithm parity. It creates no build, native release, generated archive, version, website or central register output.

## Controls and document semantics

Select a text layer and open Rich text **All** or **Paragraphs**. **Layer text wrapping** sets the default. **Selected paragraphs → Wrapping** overrides touched paragraphs; clearing paragraph overrides restores the layer mode. The optional `textWrap` field accepts `normal`, `balance`, `pretty`. Missing metadata preserves the existing greedy wrapping behavior. Auto-width text keeps its single-line-per-paragraph layout while retaining the preference for a later change to fixed/auto-height sizing.

Edits use shared Undo, survive `.oui` save/reopen and node clipboard, and inherit through real component copies and instance overrides. Text styles carry wrapping; applying a legacy/plain style restores Normal instead of retaining a consumer's previous mode. The inspector refuses inherited locks, Motion and changed editor targets. Invalid layer/paragraph/style modes and wrapping metadata on a non-text node refuse document loading or transactions before mutation. MCP transactions use the same validation and atomic Undo. Direction, text source, inline ranges and logical UTF-16 paragraph offsets are unchanged. Rich JSON/HTML clipboard carries resolved paragraph wrapping, and ordinary text splices rebase paragraph identities. Changing wrapping invalidates preserved text outlines.

## Shared measured layout

The existing shared greedy layout runs first. It establishes a complete set of line ranges and the original line count, with the same first-line indent, later-line indent, RTL leading side, list marker gutter, font/rich-run measurements and emergency grapheme breaks as before.

For supported input, a bounded dynamic program selects complete contiguous word-boundary ranges using **exactly the same number of lines**. It measures source substrings through the existing direction-aware rich-text font metrics, rather than estimating by character count or rewriting text.

Balance minimizes summed squared normalized unused width across all lines. Pretty prioritizes conventionally fuller non-final lines and penalizes a single-word final line or a final line narrower than 30% of its box; its ordinary last-line slack carries a smaller weight. It can choose a different partition from Balance. Either mode can retain an already optimal normal partition. These are explicit Forma heuristics, not a promise of typographic optimality or identical browser `text-wrap` results.

The optimizer accepts a complete same-count partition only when every chosen range fits its line's available width. A non-finite metric, exhausted budget or infeasible plan keeps the untouched greedy result. Rebuilding chosen ranges uses the normal append/metrics path, so glyph envelopes, fixed leading, paragraph spacing, auto-height, list markers and physical alignment remain shared behavior. Max-lines/height ellipsis runs afterward, preserving logical source and direction. Shared Artwork uses those actual line spans for canvas, prototypes, masks, SVG/raster export and raster design-PDF delivery. No separate CSS-only rendering path was added.

## Bounds and normal fallback

Each attempted paragraph supports at most 64 words, 8,192 UTF-16 units, 16 normal lines and 2,100 distinct candidate substring measurements. Each `textLines` call additionally permits at most 32 **attempted** optimization paragraphs and 4,096 measurement requests. The paragraph counter includes attempts that the optimizer later rejects as ineligible, not just successfully optimized paragraphs. The per-layer budget is conservative even when the shared greedy cache can reuse a measurement. Later paragraphs deterministically keep Normal once a budget is exhausted.

Auto-width, one-line paragraphs, emergency splits inside a long word/grapheme sequence, tabs/non-ASCII whitespace, unsupported line boundaries, and old inline-prefixed list markers retain normal wrapping. Modern separate/hanging markers and RTL separate markers are supported. Normal fallback also covers leading/trailing whitespace patterns whose greedy boundaries cannot map to complete word ranges. The selected preference stays persisted; fallback does not alter it or silently rewrite source.

This does not add hyphenation, dictionary-based language breaking, a full Unicode line-break implementation, cross-soft-wrap bidi state, arbitrary unlimited paragraph optimization, per-line manual breaks beyond existing newlines, or a multilingual font fallback stack. Existing font availability and headless approximate font metrics still affect measurements. Balanced/pretty results can change after fonts load or between font environments, as ordinary wrapping already can.

## Interchange and inspection

SVG records the chosen source-run line spans, so its appearance does not depend on the recipient implementing CSS `text-wrap`. CSS inspection emits a browser approximation and an explicit warning for Balance/Pretty. Editable Figma Bridge validates modes then reports that balanced/pretty wrapping is omitted; paragraph metadata retains its existing omission warning. No native editable Figma algorithm preservation or binary `.fig` compatibility is claimed. Bridge mock checks are implementation evidence, not a desktop reference roundtrip.

## Verification and status

Core checks compare measured line raggedness, final-word orphans, distinct Balance/Pretty plans, unchanged line count/source, default/emergency fallback, measurement and paragraph budgets, RTL/list/ellipsis integration, rich source ranges, paragraph inheritance/clipboard rebasing, atomic validation/history, actual generated component propagation/style reset, outline invalidation and Bridge refusal/omission. MCP checks cover persistence, atomic refusal and Undo. Browser fixtures find a real Arial width that demonstrates both improvements; checks assert actual SVG line geometry, source/ranges, HTML clipboard metadata, Undo/reopening, RTL marker gutters/exported pixels, truncation, fallback and inherited locks/Motion. Existing direction, paragraphs, emoji, accessibility, line-height, smart punctuation, tabs and background checks remain relevant regressions.

UI22-044 now has real reachable Normal/Balance/Pretty behavior for the bounded supported cases above. Recommend implementation status with these explicit limits and reference verification pending; it is not a full-Figma-parity claim or an exact CSS algorithm implementation.
