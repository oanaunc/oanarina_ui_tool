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
- Free local MCP: **40 tests passed**, TypeScript check passed.
- Development-module repository browser checks: **2 passed**.
- Clean complete production browser rerun: **293/293 passed** in 1.9 minutes against frozen production output.
- Universal native build: passed. Isolated standard native smoke passed its renderer checks, **7 camera/menu checks and 5 real Text-menu Find checks**, with empty stderr.
- Exact signed/stapled app: standard renderer, **7 camera/menu**, **5 Find**, **37 lifecycle**, **29 private-clipboard** and **13 synthetic .fig import/save** checks passed with empty stderr.
- The new real SDK stdio regression passed against both source and the exact standalone MCP ZIP: saved export profiles survive transactions/Undo, invalid profiles reject without changing file bytes/revision or leaving lock/temp files, and validation returns the current revision. The ZIP is 475,639 bytes, SHA-256 `c050e97d33e058d59a39068234933854eb30c2aacf8dfeed1e0214bc6dbcfdaf`; server stderr was empty.

The first browser run was invalidated by rebuilding its served output concurrently. Two canvas-startup failures occurred during that rebuild. A separate rotation test compared 270 with 269.9999999999999 exactly; its assertion now checks the two exact keyframe times and a tight numerical angle tolerance. Native readiness deliberately precedes the React mount: the standard smoke now waits for the actual canvas. Its new hidden-window Find check uses a bounded timer rather than waiting for suspended animation frames. These are test synchronization/assertion changes, not product timing changes.

## Release boundary

- `Forma-0.2.0-dev.12.dmg`: **32,440,052 bytes**.
- SHA-256: `04d603bf4ee76d44a978388eb2e9b078719ff4bedb631c275c2c916143c6a86a`.
- App and DMG: Apple notarization **Accepted**, stapled successfully; both Gatekeeper assessments accepted **Notarized Developer ID**.
- The mounted read-only installer contains an app matching the preserved accepted archive byte-for-byte across **312 files**; its signature and Gatekeeper assessment pass. The Applications link is present.
- Universal arm64/x86_64, macOS 13+, native version 0.2.0/build 13. Runtime checks used Apple silicon; physical Intel acceptance remains pending.
- Renderer source: `1b64b0a`; exact shared MCP archive committed in `a5146fb`. Later test/documentation commits do not change the packaged renderer. The accepted dev.11 package remains preserved separately.

No private user design, Figma ID, screenshot or signing credential is included. The exact accepted app, native reports and checksum manifest are preserved locally under `build/dev12-accepted/`.
