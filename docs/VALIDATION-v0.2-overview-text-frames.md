# Canvas overview, text search and frame delivery — 0.2.0-dev.12

Forma remains an independent staged implementation. The register contains 2,022 requirements: **1,075 implemented, 173 partial and 774 planned**. Reference verification is separate; this preview does not establish complete Figma parity.

## Reachable changes

- View/Actions provides independent persistent canvas scrollbar and schematic minimap controls. Pointer/keyboard camera gestures commit one viewport destination, cancel safely and leave document Undo, saved bytes and dirty state unchanged. See [overview scope](CANVAS-OVERVIEW.md).
- Text/Actions/Command-F provides literal text find/replace across the whole file, a captured page or selected layer trees. It previews/reveals results across pages and slides, preserves unaffected rich formatting, respects inherited locks and commits validated replacements in one Undo transaction. See [search scope](TEXT-SEARCH.md).
- Selected frames expose a static overflow preview and conservative candidate list, reusable default prototype starting points, and saved individual SVG/PNG/JPG export profiles. Overflow inspection and advanced export parity remain partial. See [frame delivery](FRAME-DELIVERY.md).

These changes add optional export-profile fields without breaking version-one/two .oui parsing. Invalid imported profiles are rejected before mutation. Explicit rich-run replacement retains all subsequent shared validation and generated/component reconciliation. Native resource/IPC permissions are unchanged.

## Review and validation

Three isolated implementation branches were reviewed by a separate agent. Review corrected modifier handling, scrollbar cross-axis key bubbling, cancellation when hiding a navigator, repeated native Find focus and single-frame export-label compatibility. Synthetic fixtures cover the supported behaviors; no private Figma file, ID or screenshot is included.

- Combined core suite: **707 tests across 70 files passed**.
- Shared editor TypeScript/Vite production build: passed.
- Free local MCP: **39 tests passed**, TypeScript check passed.
- Development-module repository browser checks: **2 passed**.
- Clean complete production browser rerun: **293/293 passed** in 1.9 minutes against frozen production output.
- Universal native build: passed. Isolated standard native smoke passed its renderer checks, **7 camera/menu checks and 5 real Text-menu Find checks**, with empty stderr.
- Exact signed app lifecycle/clipboard/import checks and app/DMG notarization: pending release acceptance.

The first browser run was invalidated by rebuilding its served output concurrently. Two canvas-startup failures occurred during that rebuild. A separate rotation test compared 270 with 269.9999999999999 exactly; its assertion now checks the two exact keyframe times and a tight numerical angle tolerance. Native readiness deliberately precedes the React mount: the standard smoke now waits for the actual canvas. Its new hidden-window Find check uses a bounded timer rather than waiting for suspended animation frames. These are test synchronization/assertion changes, not product timing changes.

## Release boundary

The public accepted dev.11 package remains intact while dev.12 completes validation. A dev.12 artifact is not labeled notarized until app and DMG both receive Accepted results, stapling and Gatekeeper acceptance. Universal Intel compilation does not establish physical Intel runtime acceptance.
