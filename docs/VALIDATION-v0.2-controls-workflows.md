# v0.2.0-dev.5 — controls and editing workflows

This development checkpoint adds persistent local preferences, layer drag/reparent and organization, parent/world alignment, aspect locks, centered resizing, continuous rotation handles and keyboard action search. It is not complete Figma parity. The public notarized installer remains v0.1.0; the local universal build is ad-hoc signed for validation.

## Validation

- `npm test`: **445 core tests across 39 files passed**. New coverage includes validated local preferences/history, search/navigation, layer move/rename preflights, transformed alignment, continuous rotation, per-node ratio locks and Motion/gesture guards.
- **23 MCP tests passed**, including the real SDK client, standalone server outside the checkout, and mixed-ratio width updates with saved-file validation/undo. MCP typechecking passed.
- **147 production-browser tests passed in 58.9 seconds**. Focused checks cover actual preferences and wheel behavior, layer drag/reparent/rename, alignment, numeric and pointer transforms, multi-selection aspect locks, palette commands/tools/history, clockwise 270° Motion playback and cancelled gesture context changes.
- The separate development-module repository concurrency test passed, preserving the last 20 of 25 overlapping named-version saves.
- Universal **arm64 + x86_64** Mac compilation and strict ad-hoc signature verification passed. Native smoke reported **154 buttons, 2,018 requirements, 1,959 Google font families and 179 installed families**. Bridge, canvas capture and MP4/WebM capability checks returned true; these capability checks do not establish native encode/playback acceptance.
- The rebuilt app opened through computer control. Native Command-comma opened the populated Preferences dialog; closing returned to the canvas. This read-only UI check did not alter settings or project artwork.
- TypeScript, frontend production build and whitespace checks passed. Build notices remain for runtime public font CSS and the main bundle size. Core tests run in a Node host that reports its unavailable experimental global localStorage; the browser-local settings helpers handle missing storage, and dedicated tests inject/validate storage independently.

Production command:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:51987 \
PLAYWRIGHT_SERVER_COMMAND='npm run preview -- --port 51987 --strictPort' \
npx playwright test --grep-invert '@development-module' --output=build/test-production-dev5-accepted
```

The first production run passed 144 checks and found three older tests targeting the former palette placeholder/button markup. Their locators were migrated to its accessible combobox/options; all nine affected selection/vector tests passed against the unchanged production bundle before the complete final gate passed all 147 checks.

## Reviewed behavior and limits

- Selection/tree moves preserve supported world transforms and paint order. Instance-managed children, protected whiteboard structures, slide roots, locked hierarchies and cycles are rejected before mutation. Current-page operations do not implement cross-page drag, component topology overrides, full layer thumbnails or specialized auto-layout insertion previews.
- Rename preview uses literal replacement and bounded `{name}`/`{n}` templates, not executable expressions or user regular expressions. Template substitution does not reinterpret inserted original names.
- Alignment translates transformed geometry in world or parent axes. Single selections target their parent; Shift/explicit parent alignment groups siblings by parent. Auto-layout-controlled children use parent layout controls. Distribution leaves endpoints fixed, with documented no-op cases.
- Aspect locks are optional `.oui` v2 fields. Width/height edits derive each selected layer separately before auto-key, honor feasible limits and reject conflicting limits atomically. Explicit width+height pairs remain explicit. MCP uses the same helper for dimension updates.
- Rotation uses accumulated pointer angles, including complete turns. Reflected parents preserve angle direction/continuity. Motion commands/handles use sampled values and correct auto-key or whole-track offsets. Invalid final angles/geometry reject without a partial edit. True affine shear still cannot be newly represented.
- Gestures capture project/page/nodes, selection, tool and motion context. Editing pauses active playback; changing context cancels without applying an old snapshot. Pan gestures retain their intentional live navigation behavior.
- Preferences and recent command IDs stay in local storage outside project Undo and `.oui`. They do not synchronize between devices. Reset affects the settings in this Preferences panel. Separate physical trackpad configuration, system theme/scale, notifications and helper permissions remain unfinished.
- Palette search covers registered commands and drawing/navigation tools, curated keywords and category/shortcut text. External library/plugin/widget discovery and user-defined shortcut remapping remain unfinished.
- Native/VoiceOver/Intel runtime acceptance and full Figma suite/interchange parity remain ongoing. Figma desktop is still inaccessible to the control connection, as recorded in the [reference audit](REFERENCE-AUDIT-2026-10-29.md). No direct binary `.fig` or real desktop plugin round-trip claim is made.

The final register records **1,004 implemented, 161 partial and 853 planned requirements**, across 60 categories (1,988 must requirements and 30 later improvements). Implementation status is separate from reference acceptance.

See [preferences](PREFERENCES.md), [layers](LAYER-TREE.md), [actions](ACTIONS.md), [canvas transforms](CANVAS-TRANSFORMS.md) and [implementation limits](IMPLEMENTATION.md).
