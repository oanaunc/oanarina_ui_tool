# v0.2.0-dev.6 validation — grids, local files and Mac windows

Date: 2026-10-29. Product: **Forma**, formerly Oanarina UI Tool. The repository, bundle identifier and `.oui` document association retain their compatible identities. This checkpoint is an evolving design editor, not completed Figma parity.

## Scope

- Responsive fixed/fractional/hug grid tracks and limits, spans, manual cells, automatic placement, cell alignment, nested/component layout, visible cell guides and undoable canvas track resizing. Horizontal stacks add direct text baselines. See [grid contract](GRID-LAYOUT.md).
- Local file folders, grid/list, title/type/folder filters, ordering, duplicate/rename/move, star/pin/archive, Trash/restore and guarded permanent removal. Explicit backup opens can revive a previously removed library identity; ordinary late autosaves cannot. See [local library](LOCAL-FILES.md).
- Native independent document windows, window-local commands/save/export, clean/dirty tracking, acknowledged close/save/cancel, recent files, reopen and session restoration. Native bootstrap guards prevent placeholder commands from acting on an opened file. Cooperating native/MCP writes share an exclusive lock and disk-revision protection. See [Mac contract](MAC-WINDOWS.md).
- Forma branding, app icon consistency, bundled MCP ZIP access, and startup camera/context-menu focus fixes found by full workflow checks.
- Companion `forma.html` retains the site's existing navigation/footer style, actual header motion, Design/Whiteboard/Slides walkthroughs, scrolling examples and a load-on-demand browser editor. Forma discovery is available across the site. Broken Algorithms destinations now open `apps.html`; `algorithm.html` and `algorithms.html` also redirect old direct links.

## Accepted shared editor checks

- `npm test`: **475 tests in 43 files passed**.
- Production `npm run build`: TypeScript and Vite build passed; independent universal Mac build uses the same production assets.
- Production Playwright: **172 tests passed**, 1.9 minutes, with a dedicated preview server at `127.0.0.1:51987` and existing-server reuse disabled. Output: `build/test-production-dev6-release`.
- Development-module repository browser checks: **2 passed** in `build/test-development-dev6-final`.
- MCP: **27 tests passed**, including real SDK stdio client and standalone ZIP outside the repository, grid edits/rollback, bounded growing-file reads, malformed UTF-8 rejection, actual FIFO refusal and replaced-lock ownership. `npm run mcp:check` passed.
- `git diff --check` passed.

The first production pass had 151/156 checks pass. Two action-palette expectations needed to include the newly registered New command; the remaining failures exposed deferred layer-menu focus and late startup camera timing. Focus restoration now respects a newly open menu/dialog, and startup fit cancels after input or view/document changes. The affected workflows and the complete final suite passed afterward. Independent grid review reproduced and fixed right-button interception, stale resizing after Space/tool changes and unfinished resizing after window blur.

## Native and release checks

The final Developer ID signed universal app passed standard startup/font/capability smoke and **37 actual native lifecycle checks**, with isolated test data and temporary files. The standard smoke found Forma branding, 63 real buttons, 2,018 register entries, 1,959 Google families and 179 locally installed families. Strict signature verification passed after both runs. Intel is cross-compiled; physical Intel runtime acceptance is still pending. A codec capability flag alone is not complete native video-encoding acceptance.

The final app and DMG both passed Apple notarization (**Accepted**), stapling and Gatekeeper (**Notarized Developer ID**). `npm run package:mac` exited successfully. A stale lock-guidance sentence in the bundled MCP README was corrected before the final signed artifact was rebuilt; all 27 MCP tests and both signed-app smoke runs passed after that correction.

- Installer: `Forma-0.2.0-dev.6.dmg`, **32,540,501 bytes**.
- SHA-256: `037b9305fcf23aaa55bee01f60c06c5e6521ac321efddcf7d2ff23914f9c698a`.
- Standalone MCP ZIP: **469,626 bytes**, SHA-256 `03e2d38742e6b7aa33360e357f41ada575e5651ce7b78b5a009b557be90002a0`.
- Native evidence: `build/package-dev6-final.log`; isolated final-artifact standard/lifecycle smoke output in `/tmp/forma-final-artifact-{standard,lifecycle}.stdout` during this validation session.

Forma.app has a different filename from the older Oanarina UI Tool.app. Quit the older app before copying Forma into Applications. Existing `.oui` files and compatible application data retain their identity; do not remove project files or app data during this upgrade.

## Companion website evidence

The website's 12 automated browser-check groups cover real video playback controls and range-based chapter seeking, reduced-motion posters, mobile layout, iframe drawing/Undo/Redo/reload with separate demo storage, feature filters, valid downloads and query/hash-preserving legacy redirects. Actual Mac WebKit playback was also checked: the explicit walkthrough advanced with readyState 4 and no media error; ambient videos decoded and paused offscreen. The published download checksum matches the release artifact above. The website repository retains its own deployment history.

## Limits

The register tracks 2,018 named requirements, not exhaustive proof of reference parity. Full binary `.fig` interchange, cloud collaboration, remote libraries, complete Draw/Dev Mode/FigJam/Slides/Sites/Buzz/Make workflows, native document tabs, complete typography/VoiceOver/hardware acceptance and large-document performance remain unfinished. Only supported SVG/plugin interchange is claimed.

Grid bounds, cyclic sizing, manual-collision behavior and missing track-reordering/deletion semantics are explicit in the grid document. Local Home organization is not a team account; browser document content still has last-writer behavior across tabs. Saved-file MCP coordination does not provide live renderer synchronization or durable server undo. Other applications ignoring the shared lock can race file changes. Recovery depends on retained local storage and cannot protect edits that never reached a completed write.

Figma desktop remains detectable but unavailable through the current computer-control attachment: bundle-ID lookup fails and direct inner-bundle attachment times out. No successful desktop visual/plugin-UI inspection is claimed. Public primary documentation supported the grid audit; per-feature reference verification remains separate from implementation.
