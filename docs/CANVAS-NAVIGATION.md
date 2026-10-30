# Canvas navigation

The View menu and Actions palette expose Previous viewport, Next viewport, Find selected object on canvas, Show frame names and Show section names. Camera commands use Option-Command-Left, Option-Command-Right and Option-Command-F respectively. Existing Zoom to selection (Shift-2) remains available.

Camera history retains at most 100 views in the current window. Wheel/hand-pan changes less than 400 ms apart form one gesture; explicit zoom/fit/find actions create separate destinations. Navigating backwards and then changing the camera discards the forward branch. A page switch, new document or explicit document load starts fresh history. The existing remembered page cameras continue working independently. History is ephemeral and does not enter `.oui`, document undo, local document recovery or native dirty state.

Find selected object centers the visible selection using its transformed bounds, including the currently sampled timeline position while Motion mode is open. It preserves the current zoom for smaller selections and zooms out for larger selections, within the editor's existing 5% minimum. Hidden selections produce a clear message. At that zoom limit, exceptionally large selections may extend beyond the viewport.

Frame/component names and section names are independent device-local preferences. They control ordinary top-level and eligible nested frame/component and section labels. Names follow transformed world bounds and stay horizontal at a constant screen font size. Nested names require room inside all supported ancestor clips; see the conservative limits below. Changes persist in the preferences envelope, including migration from existing version-one preferences, and do not modify artwork or exports. The web View menu exposes checked states and unavailable history actions are disabled. The native menu uses the same additive command registry and AppKit arrow function-key equivalents.

## Verification

- `npm test`: 657 tests across 66 files passed before the final additional shortcut assertion; the final focused navigation suite passed all 5 tests, including physical Option-generated shortcut keys.
- `npm run build`: production build passed.
- Production Playwright navigation/page-camera/preferences checks: 12 passed, covering actual wheel panning, zoom selection, history branching/reset, save/undo isolation, independent persistent name toggles, Actions palette execution and centered offscreen selections.
- Final navigation production browser suite: 4 passed, including actual hand-tool dragging and modified-wheel zoom; 13 distinct browser cases passed across the two runs.
- Synthetic fixtures only; no user project, Figma ID or private screenshot is included.

Native integration: `Studio.accelerator(_:)` maps `←` and `→` to AppKit function-key Unicode scalars `0xF702` and `0xF703`. The universal candidate passes seven native navigation checks, including actual Option-Command-Left/Right menu dispatch and observed renderer camera restoration without dirtying the document. These checks also pass on the accepted signed/stapled dev.11 app. See [combined validation](VALIDATION-v0.2-navigation-frames.md).

Reference verification against Figma is pending. This is a bounded navigation improvement, not a claim of complete editor parity.

Motion preview regression: Find selection uses the same `sampleMotion` result as Canvas when Motion mode is open. The focused navigation/motion core suite passed 22 tests. Production build passed, and the expanded production navigation suite passed 5 browser tests, including scrubbing to the animated offscreen position before finding it. Coverage checks sampled and base positions, camera Back, unchanged animation and native clean state.


## Nested canvas names

The existing View and Actions name toggles now cover eligible nested frames, main components and sections. Ordinary untransformed top-level anchors keep their prior position. Rotated, reflected and scaled containers use the top-left of their world layout bounds, with a 14-pixel screen gap and an 11-pixel screen font. The overlay measures current browser fonts and refreshes after font registration. Names elide to at most 80 code points and 240 screen pixels; their title is bounded to the first 256 source units. This does not change saved names.

With Move or Scale in visible Design mode, a name explicitly targets its own container, so a nested label cannot accidentally drag its ancestor. The ordinary canvas gesture supplies selection, dragging, one-step Undo and persistence. Inherited locked names are visible but read-only. Motion labels use the same sampled scene as artwork and remain read-only. Prototype/Inspect, hidden UI, point editing, crop mode, other tools and modal/home states also disable label hits; names are still controlled by their independent visibility preferences. Immediate context invalidation refuses retained stale pointer handlers.

Visibility is deliberately conservative: hidden/zero-opacity hierarchies, instance roots and generated descendants, slice subtrees, live booleans, mask sources and their affected sibling/subtree runs do not get names. Whiteboard sticky/table and Slides-owned frames are omitted. For nested names, both the container’s full transformed rectangle and the measured horizontal label must fit every ordinary rectangular/rounded ancestor clip. Partly clipped containers, unsupported vector/ellipse clips, collapsed/nonfinite/extreme geometry and chains beyond 64 clipping ancestors are omitted. Mask modes are not approximated by rectangular label visibility.

The iterative index supports the existing 20,000-layer page limit without recursive ancestry walks. Placement examines at most 2,000 eligible candidates and emits at most 500 labels in document order. Neighbouring labels and unrelated foreground artwork do not have a collision/occlusion solver; overlapping names can be hidden using the existing toggles. These bounds and complex paint/clip exclusions keep UI-06-025 and UI-06-026 partial. No Figma reference-verification upgrade is claimed.

Source checks: 1,405 core tests across 119 files passed, including ten new geometry/visibility/budget checks and a reversed 20,000-layer hierarchy. Eleven actual browser checks passed (six new nested-name workflows and five existing canvas-navigation workflows), covering independent persistent toggles, signed affine anchors, zoom/UI-scale sizing, exact-container drag/Undo, full clipping/ownership suppression, sampled Motion, locks and retained same-event context refusal. TypeScript and MCP source type checks passed. No app/native build, package, archive, website or release artifact was generated.
