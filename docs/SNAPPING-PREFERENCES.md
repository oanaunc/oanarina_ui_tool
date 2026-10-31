# Local snapping preferences

Preferences → Local snapping adds independent device-local pixel, object and vector-geometry overrides. Each starts at **Follow document**. The three fields are additive version-1 preference migrations; they are never added to a `.oui` document, component definition, library package, source MCP document, or Undo history. Preference persistence validates first and reports blocked/quota storage failures without publishing an unsaved setting.

## Precedence and actual interactions

The saved document snapping master switch always wins. Preferences shows an explicit suspended notice when it is off. Guides and layout-guide snapping retain their document settings. Object On/Off overrides the existing object-edge, center, frame-edge and equal-spacing channels together. Pixel choices are Off, Whole pixels and Half pixels. Vector choices control existing eligible path anchor/curve targets.

Follow document keeps the previous creation behavior: movement, eligible resizing and single-anchor editing use their existing document channels, while new drawing and Pen placement remain free. Explicit local pixel or Object On also snaps shape/Pen/continuation placement endpoints. Explicit Vector On adds eligible geometry targets to Pen/continuation placement. A continuation armed on an endpoint keeps that operation when the next click lands on another path; the click supplies its target instead of switching the edited path.

The shared existing solvers drive actual Canvas movement, positive axis-aligned resizing, and eligible single-anchor dragging. Endpoint snapping happens in world coordinates before conversion through a rotated/reflected parent, and shape release uses the same endpoint calculation as the draft. Creation uses displayed Motion object geometry; geometric path targets remain disabled while Motion is open. Command/Control bypass snapping. A geometry hit keeps its exact fractional point instead of being rounded again to a pixel.

## Draft lifetime and storage

Relevant changes synchronously cancel pending Pen/continuation and active affected drafts without committing them. Permanent source and local-setting receipts reject retained callbacks even after settings or editor contexts leave and return to the same values. New rendered controls and new gestures recover normally. Source changes, pointer cancellation/lost capture and window blur also clear these drafts. Unrelated preference changes leave snapping gestures and pending Pen completion alone.

A domain-only observed revision reads validated old/new storage-event snapshots as well as current preferences. This detects a second window changing On → Follow document even if both writes have completed before the first event is handled. The general preference storage service is unchanged. Cross-window observation requires the browser's normal same-origin storage events; this is not remote collaboration.

## Limits and status recommendations

The three preference behaviors are reachable and persisted. Broader snapping coverage remains limited to the existing interaction solvers: rotated/centered resize cases that previously bypassed snapping still bypass it; multiple-anchor/handle manipulation, Pencil/freehand and specialized vector tools do not gain new snapping behavior. Keyboard nudges and numeric property edits retain their existing behavior. Guide/layout channels are deliberately separate document controls.

Vector targets use the existing bounded eligible-path solver (20,000 page nodes, 4,096 target anchors, 2,048 target segments and its existing ancestor/coordinate checks). Invisible, managed, Boolean, masked and clipped geometry is excluded conservatively. Explicit Vector On reports unavailable target indexing before starting an affected edit; Follow document retains its prior fallback. This pass does not expand those limits or claim native/Figma reference parity. Recommend partial status where the register requires all manipulation paths rather than the implemented local preference workflow.

## Validation evidence

`tests/snapping-preferences.test.ts` covers additive migration, strict values, storage refusal, precedence, unchanged document policy, real pure solver outputs, geometry-over-pixel priority and remote transition observation. `tests/e2e/snapping-preferences.spec.ts` exercises local persistence outside `.oui`/history, native button activation at 125%, actual moved/resized/created/vector coordinates, transformed parents, Motion targets, Pen/continuation, blocked storage, local and remote away/back cancellation, fresh retries and unrelated-preference continuity. Adjacent preference, transformed Canvas, precision, shape creation and vector-snapping browser suites are run with it. Source tests/types/source MCP are used; no production/native build, archive or release was generated.

Frozen-source checks: 2,231 core tests across 192 files; 79 actual browser cases (21 new plus 58 adjacent); editor and MCP TypeScript; 94 source MCP protocol tests, zero skips. An initial concurrent font-download timeout passed both focused rerun and the final full core run. The browser server was restarted after source freeze to avoid Vite HMR timestamp imports creating a second store in bare-module test imports. A Motion target fixture was separated from a legitimately nearer unrelated path; the final combined run is green.

**Device pixels · this display** is a local pixel-snapping choice that rounds to one physical pixel of the current display at 100% zoom: half a unit at 2x, a third at 3x. The ratio is read on every snap, so moving a window between screens takes effect on the next drag. It stays out of `.oui` files, and a document cannot store it. At other zoom levels it is still the 100% device grid, not the pixels on screen.
