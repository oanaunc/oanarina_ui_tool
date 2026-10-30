# Canvas navigation and frame workflows — 0.2.0-dev.11

This preview continues Forma's staged implementation. It is not a complete Figma clone. The register has 2,022 requirements: 1,070 implemented, 172 partial and 780 planned. Reference verification remains separate from implementation status.

## Reachable behaviors

- View/Actions: Previous viewport, Next viewport and Find selected object on canvas. Camera changes are ephemeral, bounded and independent of document Undo, recovery and native dirty state. Finding selection follows sampled motion while the timeline is open.
- View/Actions: independent persistent frame and section name controls. Both remain partial because only existing top-level labels are covered.
- Assets: searchable Watch, Paper and Presentation preset groups create ordinary editable frames with Undo/save.
- Single-frame Design inspector: orientation swap, visible unlocked direct child selection and guarded fit-to-content. Fit remains partial; it uses direct child rectangular bounds, excludes stroke/effect padding and refuses managed, generated, motion and auto-layout contexts.

See [navigation scope](CANVAS-NAVIGATION.md) and [frame scope](FRAME-WORKFLOWS.md).

## Independent review and corrections

A separate reviewer exercised camera and inspector workflows and checked the implementation. Review found and fixed three concrete issues before integration: Find selection using base rather than sampled motion geometry; fit accepting nonfinite descendant world matrices; and finite matrix coefficients whose transformed corners overflowed. Synthetic parsed documents cover both overflow cases and atomic refusal without changing document, selection or Undo state.

The native integration maps left/right arrows to AppKit function-key equivalents. Its opt-in standard smoke check exercises actual menu dispatch for Option-Command-Left/Right and observes the WKWebView camera and clean-state behavior. Smoke execution uses nonpersistent WebKit storage and does not touch user projects, saved sessions or the general clipboard.

## Validation evidence

- Combined core suite: **673 tests across 67 files passed** after register/release-history reconciliation.
- Production TypeScript/Vite build: passed.
- Development-module repository browser checks: **2 passed**. Free local MCP: **39 tests passed**, with TypeScript check passed.
- Universal native build: passed. Isolated native checks: standard renderer plus **7 navigation**, **37 lifecycle**, **29 clipboard** and **13 synthetic .fig import/save** checks passed; stderr empty.
- First integrated production browser run: **275 passed, 1 failed**. A deterministic diagnostic proved that the eraser test read target coordinates before delayed startup fit, then clicked obsolete coordinates. Moving the actual Eraser selection before the bounds read fixed test synchronization without changing product timing; the focused suite passed eight repeated cases. The final clean complete production run passed **276/276** browser checks in 1.8 minutes.
- The exact signed/stapled dev.11 app repeats the standard renderer, seven AppKit navigation, 37 lifecycle, 29 private-clipboard and 13 synthetic .fig import/save checks successfully, with empty stderr.

## Accepted Mac package

- `Forma-0.2.0-dev.11.dmg`, **32,319,485 bytes**.
- SHA-256: `84106a2da66683797bcde07ed58d100f0cbe5474ddf2e2c09ce941f79dec48b3`.
- App and DMG: Apple notarization **Accepted**, stapled successfully; Gatekeeper accepted both as **Notarized Developer ID**.
- macOS 13+, universal Apple silicon/Intel binary; runtime checks were on Apple silicon. Physical Intel runtime validation remains pending.
- Bundled source was commit `e4fc048`; final acceptance documentation does not change the packaged renderer. The previous accepted dev.10 app is preserved separately.

The original user Figma source and private import screenshots are excluded. No document schema change or expanded native filesystem/network permissions were introduced.
