# Canvas navigation

The View menu and Actions palette expose Previous viewport, Next viewport, Find selected object on canvas, Show frame names and Show section names. Camera commands use Option-Command-Left, Option-Command-Right and Option-Command-F respectively. Existing Zoom to selection (Shift-2) remains available.

Camera history retains at most 100 views in the current window. Wheel/hand-pan changes less than 400 ms apart form one gesture; explicit zoom/fit/find actions create separate destinations. Navigating backwards and then changing the camera discards the forward branch. A page switch, new document or explicit document load starts fresh history. The existing remembered page cameras continue working independently. History is ephemeral and does not enter `.oui`, document undo, local document recovery or native dirty state.

Find selected object centers the visible selection using its transformed bounds, including the currently sampled timeline position while Motion mode is open. It preserves the current zoom for smaller selections and zooms out for larger selections, within the editor's existing 5% minimum. Hidden selections produce a clear message. At that zoom limit, exceptionally large selections may extend beyond the viewport.

Frame/component names and section names are independent device-local preferences. They control the existing top-level canvas labels; nested containers do not gain additional labels. Changes persist in the preferences envelope, including migration from existing version-one preferences, and do not modify artwork or exports. The web View menu exposes checked states and unavailable history actions are disabled. The native menu uses the same additive command registry and AppKit arrow function-key equivalents.

## Verification

- `npm test`: 657 tests across 66 files passed before the final additional shortcut assertion; the final focused navigation suite passed all 5 tests, including physical Option-generated shortcut keys.
- `npm run build`: production build passed.
- Production Playwright navigation/page-camera/preferences checks: 12 passed, covering actual wheel panning, zoom selection, history branching/reset, save/undo isolation, independent persistent name toggles, Actions palette execution and centered offscreen selections.
- Final navigation production browser suite: 4 passed, including actual hand-tool dragging and modified-wheel zoom; 13 distinct browser cases passed across the two runs.
- Synthetic fixtures only; no user project, Figma ID or private screenshot is included.

Native integration: `Studio.accelerator(_:)` maps `←` and `→` to AppKit function-key Unicode scalars `0xF702` and `0xF703`. The universal candidate passes seven native navigation checks, including actual Option-Command-Left/Right menu dispatch and observed renderer camera restoration without dirtying the document. The accepted dev.10 artifact remains unchanged; see [combined validation](VALIDATION-v0.2-navigation-frames.md) for the new candidate.

Reference verification against Figma is pending. This is a bounded navigation improvement, not a claim of complete editor parity.

Motion preview regression: Find selection uses the same `sampleMotion` result as Canvas when Motion mode is open. The focused navigation/motion core suite passed 22 tests. Production build passed, and the expanded production navigation suite passed 5 browser tests, including scrubbing to the animated offscreen position before finding it. Coverage checks sampled and base positions, camera Back, unchanged animation and native clean state.
