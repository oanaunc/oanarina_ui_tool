# Design health report

Resources → **Design health report…** (also in Actions) reads the saved document locally and groups findings into Contrast, Duplicate colors, Token consistency, Unused styles, Detached instances, Layer hygiene and Transfer. This is a source implementation, not a Figma reference verification or native release acceptance result.

The report is headless: `src/design-health.ts` aggregates pure audits in `src/audit-*.ts` and `src/transfer-compatibility.ts`, so every rule runs against the document model in unit tests with no DOM. Opening the report changes nothing. **Show** selects the real layer and page. A fix runs through one editor transaction, so one Undo reverses it; **Undo last fix** does the same without leaving the dialog. Presentations are read only here, and fixes are refused while Motion is open. Counts are rule findings, not a quality score.

Reports export as Markdown or JSON. Both contain layer and page names, hex values and an 80-character text preview. They never contain embedded images, fonts, comments or full text.

## Contrast (UI-54-011)

Every visible text layer is walked down painter order against the layers behind it, with saved opacity along the ancestor chain, translucent layers composited, a saved text background honored, and large-text thresholds of 24 px or 18⅔ px at weight 700. Gradients use their worst stop and rich text its worst range, so a result is a lower bound.

A result is **Not evaluated**, never a pass, when the background is an image or video, a stacked gradient, a blend mode, a mask source, background blur, a partial overlap, a rotated layer, a non-rectangular shape, or the theme-following canvas. Non-text contrast (WCAG 1.4.11), incidental text, logos, transformed font sizes, layer effects and clipped or overlapped-from-above text are not assessed. Images are not sampled.

**Use #hex** moves lightness in the same hue to the nearest passing value. It is offered only for one solid literal fill, and refused for bound, styled, locked, component-managed or mixed-color text.

## Duplicate colors (UI-54-015)

Saved solid fills and strokes, gradient stops, text ranges, color variables, paint styles and the document palette are indexed case-insensitively. An exact group needs an unlinked color on two layers, an unlinked color equal to a token, or two definitions of one color. Near groups cluster around the most used or tokenized color within ΔE 3 (CIE76); only the 2,000 most used colors are compared, with a visible warning beyond that.

A group can merge into a new color variable, a new paint style, an existing token or a literal color. Variables bind top fills and strokes and keep alpha. A paint style links only a single opaque fill, because styles replace the paint stack. Gradient stops and text ranges are recolored as literals. Linked channels stay on their token, and locked or component-managed layers are skipped and counted. If nothing would change, no token is created. If derivation would overwrite a merged color, the whole merge is refused. Variable and style color resolution uses the default mode. The palette can drop repeated entries.

## Token consistency (UI-54-016)

Fill, stroke, radius, gap, padding, font size, opacity and stroke width are compared to local variables resolved in each layer's own effective modes, and scopes are respected. Findings: exact unlinked matches, values close to a token (±5% or 1 px, ΔE 3), paint, text and effect styles proved equal, links to missing variables or styles, wrong-kind style links, and scope violations. Text style equality is proved by applying the style to a scratch layer. Instance copies inherit from their main component and are not listed.

Fixes bind or link; **Snap** on a close value visibly changes it and says so. Stale links can be removed, which keeps the literal value. Stale report rows are revalidated and skipped. The coverage figure is the share of checked values already linked; only these fields count, not the whole layer.

## Unused styles (UI-54-013)

Paint, text, effect, stroke and layout guide styles use the existing conservative asset usage index, which counts hidden, locked and cross-page references. Removal re-proves in the draft that every chosen style is still unreferenced and refuses all of them otherwise. Incomplete scans and styles from installed libraries are never removable. Files that publish a library are flagged, because external consumers are invisible here. Variables are not removed by this audit.

## Detached instances (UI-54-014)

Detaching now records `detachedFrom` (main component ID and name) on the frame. The field is additive, optional and validated on import; legacy files have no record. Findings: recorded detaches, detaches whose main was deleted, orphaned instances, and frames whose name and exact ordered layer-type tree both match a main component. That last group is only a likely match and cannot find a renamed or edited copy.

**Restore instance** replaces the frame with a fresh instance at the same parent, paint position, geometry and root layer ID. Local edits inside it are replaced, and Undo returns them. It is refused for locked, managed, slot, mask and boolean layers, and when a prototype link, Motion track or comment points inside the frame. **Keep as frame** clears only the record. Orphans can be detached.

## Layer hygiene (UI-54-010)

Hidden layers, visible layers at 0% opacity, empty unpainted containers and default-named top-level or container layers are listed, with font family and size counts and embedded image size. Instance copies are excluded. These are prompts to review. They have no automatic fix.

## Transfer compatibility (UI-54-005)

The Transfer tab forecasts what this file's saved features become in Figma Bridge, SVG and PNG/JPG: kept, approximate, omitted or refused. Rules mirror the Bridge plugin's refusal and report code, and a unit test checks those phrases still exist in `figma-plugin/code.js`. Comment, audio and annotation counts come from running the real `prepareFigmaDelivery`. This is a forecast from source: it is not a real Figma desktop plugin round trip, and it does not model font substitution, which the plugin reports at import. PDF is not forecast.

## Validation

`tests/design-audit.test.ts` covers WCAG boundaries, compositing, every withheld case, gradient and rich text worst cases, work budgets, merges through real editor Undo and save/reopen, mode-aware token matching, scopes, stale rows, library protection, detach provenance, restore order, malformed provenance, Bridge source agreement, export privacy and a 4,000-level hierarchy. `tests/e2e/design-health.spec.ts` drives the real menu, navigation, fixes, Undo, saves and report downloads in a browser.
