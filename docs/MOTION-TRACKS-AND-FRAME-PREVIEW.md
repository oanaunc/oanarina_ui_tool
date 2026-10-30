# Motion tracks and explicit animated-frame preview

UI-56-011 now has explicit track selection, beyond its former layer-only
selection. UI-56-050 has a working fullscreen frame-animation/prototype-preview
path; combined overflow/advanced transition behavior still has the limits below.
These are source implementation findings, not verified Figma or native Mac
acceptance results.

## Track selection

Click a property track label to select that track and its source layer. Shift,
Command or Control toggles additional tracks. The selected row highlight and
Motion inspector share the actual track IDs; keyboard button activation works.
The inspector can select all keys in these tracks, enable/disable them or delete
them together. Visibility and deletion are validated single Undo steps and
persist through ordinary .oui save/reopen. Inherited locks and managed component
ownership refuse the complete edit. Selection remains local, is pruned when
tracks disappear, and clears across pages/documents. Inspect can select tracks
and seek keys, while saved track mutations remain Design-only.

## Frame preview

Choose **Preview animated frame** in the timeline, or **Preview animation** for a
specific animated frame in the Motion inspector. The existing prototype
presenter gains an explicit Motion transport: Play/Pause, Restart, scrub time,
readout and the shared local motion preference. Its existing Full screen,
prototype navigation, variable/variant actions and overlays remain available.
Ordinary prototype presentation follows its existing renderer and policies.

The Motion preview uses the saved frame's fixed base axes and dimensions, then
samples actual page motion into that viewport. Frame/root motion can therefore
move within this fixed output viewport; it does not recenter the viewport on
every sampled pose. Saved base artwork, keys, easing, duration and loop are never
changed by presenting, scrubbing, fullscreen or navigation.

Required parent transforms, rectangular clips and sibling mask runs are retained
in the shared Artwork renderer. A cached topology/transform pass supports up to
20,000 page layers and 256 hierarchy levels without repeated page-array scans.
Render-only SVG namespaces prevent collisions with the still-mounted editor,
including normalized smart-transition artwork. No synthetic ID is persisted.
The preview keeps image/text/gradient/effect rendering in the existing shared
renderer; embedded video is represented by its poster in this Motion transport.

The source request is bound to the exact document object, page and frame. Source
replacement, page/modal changes, leaving Design, closing Motion, hiding the UI or
opening another workspace invalidates it, including same-event away-and-back
cycles. Active key and Bézier gestures cancel immediately on UI scale changes.

Reduced motion reuses the existing device preference: activation pauses playback;
explicit Play runs once despite an authored loop. Opening controls does not
interrupt that explicit pass. Space on the presentation stage toggles playback
and restarts after the last frame. Blur/visibility pauses preview playback.
Prototype/Slides saved motion policies and exported animation data are unchanged.

## Remaining limits

- Explicit Motion preview retains an authored viewport while native overflow,
  fixed/sticky positioning and semantic scroll restoration now work as described
  in [MOTION-FRAME-SCROLLING.md](MOTION-FRAME-SCROLLING.md).
- Isolating a frame inside a live Boolean, mask-source, slice or video ancestor,
  nonrectangular ancestor clip, active ancestor effect or non-normal ancestor
  blending is refused with an explanation. Retained subtree effects still work.
- The existing Smart Animate matcher normalizes frame subtrees. For frames with
  external ancestor/mask context or scrolling, Motion preview refuses that transition before
  changing local prototype state; the current correctly masked frame remains.
  Use instant/dissolve or ordinary prototype presentation. Safe isolated frame
  smart transitions still work, with separate SVG IDs.
- Preview budgets do not promise interactive playback at every combined model
  maximum. Authored media-codec behavior and native Mac trackpad/fullscreen
  acceptance remain separate checks; no native or app build was made.

Recommend **implemented** for UI-56-011. Keep UI-56-050 **partial** if its scope
includes combined overflow/advanced ancestor-aware prototype transitions; its
explicit fullscreen sampled-animation workflow is now reachable and tested.

## Validation

- Full `npm test`: **1,547 tests / 129 files passed**, including 17 new track and
  preview cases plus the retained Motion navigation/editor guard cases.
- Editor TypeScript and `npm run mcp:check`: passed.
- `node scripts/test-mcp-source.mjs`: **58 source MCP tests passed**. The document
  schema is unchanged; existing motion validation, persistence and Undo remain.
- **55 focused browser checks passed** across new track/frame preview, Motion,
  interface motion, Dev inspection and prototype suites. Eleven new frame/track
  browser cases exercise selection/Undo/save, Inspect seeking, actual sampled
  pixels with rotated/reflected ancestors and masks, actual Chromium fullscreen,
  prototype navigation, SVG definition uniqueness, reduced one-shot behavior,
  1280×720 at 125% scale, source/context invalidation, gesture cancellation and
  explicit refusal of an unsupported masked smart transition.
- The reviewed plain/Shift-only Bézier arrow guard and viewport-history shortcut
  regression from the parent integration are preserved.

No build/bundle/archive/package/version/download/website changes were made.
