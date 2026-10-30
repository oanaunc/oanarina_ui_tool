# Motion inspector and timeline workflows

This source pass completes the named editor behaviors UI-56-002, UI-56-023,
UI-56-026, UI-56-030, UI-56-046, UI-56-051 and UI-56-059. These recommendations
refer to reachable Forma source behavior; independent Figma reference checks and
Mac hardware/WKWebView acceptance are separate and remain pending. The app as a
whole still has remaining parity work.

## Reachable behavior

- **Motion inspector:** the right properties tabs include Motion. It opens the
  timeline, shares its selected keys, shows sampled time separately from saved
  base artwork, adds property keys to selected layers, edits selected easing,
  and navigates to animated frames. Layer and frame lists are paginated/searchable.
- **Pinch zoom:** Ctrl-wheel trackpad magnification, two touch pointers, and
  WebKit cumulative `gesturestart/change/end` magnification zoom the timeline
  continuously from 1× to 32×. Time under the gesture stays anchored, except at
  scroll bounds. The canvas and browser zoom are unaffected. Existing zoom
  buttons provide a keyboard-accessible alternative.
- **Space-drag navigation:** focus the track surface and hold Space while
  dragging to pan horizontally and vertically; middle-button dragging also pans.
  A Space press/release without dragging toggles playback. Buttons keep their
  normal keyboard activation. Navigation does not edit saved artwork or history.
- **Marquee keys:** drag empty track space across lanes, then release to select
  the keys whose time/row centers are inside the rectangle. Shift, Command or
  Control adds to the previous selection. Escape cancels. The query uses source
  rows, including keys represented by density clusters or outside mounted rows;
  collapsed tracks remain excluded until expanded.
- **Bézier editor:** choose Bézier easing, then drag either graph handle in the
  Motion inspector or the timeline's Edit easing curve disclosure. Release
  commits one Undo step for all selected keys. Arrow keys adjust time/progress
  by 0.01, or 0.1 with Shift. Time coordinates stay in 0–1; progress allows the
  existing validated −10…10 overshoot. Numeric fields remain available. Drafts
  never mutate the document; Escape, blur, visibility/viewport or context changes
  cancel them. A foreign pointer cannot replace or cancel the active drag.
- **Animated frames:** the inspector finds highest frame ancestors with enabled,
  changing tracks, including frames inside sections and animated descendants
  inside nested frames. Hidden layer hierarchies and constant tracks are omitted;
  equivalent hexadecimal fill casing is constant. This examines visibility flags
  and authored values, not composited opacity, clipping or pixel visibility.
- **Reduced motion:** the existing local Interface motion preference is reused.
  Reduction activating pauses editor playback. Explicit Play previews one pass
  and stops at the duration; the saved loop value and exported animation remain
  unchanged. Opening policy controls or the inspector does not interrupt that
  explicit pass. Scrubbing remains available. Prototype and Slides policies are
  unchanged. Follow system, Reduce motion and Allow motion are reachable locally.

## Data, guards and scale

No document fields or .oui version changes were added. Curves, key values/times,
tracks and animation styles use the existing validated motion model and save,
reopen, Undo and MCP replacement paths. Selection, navigation, inspector state,
zoom, clusters and previews remain editor-only.

Mutating workflows verify their captured document/page/layer selection, visible
Design editing state, current shared key selection and affected layer ownership.
Inherited locks and managed instance descendants refuse atomically. Changes to
source/context invalidate retained callbacks even during an away-and-back cycle.
Graph and timeline gestures require the active captured pointer; cancellation
cannot apply a partial draft. Changing timeline row layout or zoom cancels a
running key drag/marquee. CSS UI scale is included in coordinate conversion.

Track rows are virtualized. Visible dense keys are grouped with bounded, paged
cluster lists (40 per page); every original key stays available. Marquee queries
all source keys in the intersecting rows. The existing shared document/model
limits continue to apply, including 20,000 tracks and 10,000 keys per track;
this does not promise interactive playback at every combined maximum. Frame
ownership uses one cached hierarchy traversal, including reverse-ordered 20,000
node hierarchies. No cloud motion, fullscreen prototype integration or codec
availability is implied by these seven completed editor behaviors.

The WebKit listener follows Apple's documented cumulative
[GestureEvent scale](https://developer.apple.com/documentation/webkitjs/gestureevent/1632653-scale).
Chromium CDP touch input and synthetic WebKit events are source interaction
checks, not a real Mac trackpad/WKWebView acceptance result.

## Validation

- `npm test`: 1,529 core tests across 128 files passed, including 16 new Motion
  workflow cases (data guards, Undo/reopen, source marquee, zoom and 20k hierarchy).
- Editor TypeScript and `npm run mcp:check` passed.
- `node scripts/test-mcp-source.mjs`: 58 source MCP tests passed, including real
  project replacement/reopen/Undo and byte-preserving rejection of malformed
  editor Bézier values.
- Focused source browser suite: 26 passed (16 new Motion workflows plus 10
  existing Motion and Interface motion regressions). New cases include real two-touch magnification,
  125% marquee geometry, short-window 10,000-key clusters, keyboard selection,
  active/foreign pointer handling, retained-context refusal, preview/release/Undo,
  save/reopen and live reduced-motion override behavior. The final run passed all 26 checks.

No app build, bundling, archive generation, release/package/version change,
native build or website change was performed. Download/archive parity and native
reference acceptance remain deferred under the user's build freeze.
