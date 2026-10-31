# Local interactive prototypes

Open Prototype in the right sidebar. Select a layer and drag its connection handle to a frame or section, use Quick navigation, or add an interaction with ordered actions. The connection list supports search, selection and removal; named starting flows can be added, reordered and described. Destination warnings identify missing targets. All authoring is stored in the .oui file and participates in undo.

Supported actions are navigation, back, external HTTP(S) links, open/swap/close overlay, scroll to a layer, change an instance variant, set a variable, and conditional branches. Conditions can nest; an else-if can be expressed as a conditional in the else branch. Interactions support click, drag, hover, press, mouse enter/leave/down/up, delay, keyboard keys with modifiers, gamepad buttons and scroll. Gamepad playback depends on browser/device support.

Expressions support numeric arithmetic, strings, booleans, comparisons, logical operators, parentheses and the functions var, concat, min, max, round, abs and length. Use `var("Name")` or a variable identifier. Expressions are parsed, never evaluated as JavaScript. Validation caps input depth, size, numeric range and action count. An invalid action batch leaves the preview state unchanged.

Present opens a local modal preview with flow/frame selection, previous/next/back/restart, fit/actual/fill sizing, fullscreen where available, hotspot hints and a variable-state panel. Preview state stays separate from saved artwork. Active frame and overlay modes materialize their variable values. Navigation can preserve scroll or reset component state.

Transitions include instant, dissolve, smart animate, move, push and slide directions, with duration, standard easing, cubic bezier and spring controls. Smart animate matches named layer paths and interpolates transforms, scale, dimensions, opacity, radius, independent corners, compatible paint stacks, solid stroke stacks of the same length and alignment, effect stacks of the same types, and font size, letter spacing and line height for plain text. Different images and different words crossfade in place. Stacks that do not match take the destination value at once, shapes do not morph between topologies, and rich text does not animate its size. Interrupting a Smart animate frame change starts the next one from what is on screen; layers already fading out vanish at that moment. Opening, swapping and closing overlays use the chosen transition. Overlay options include manual or centered placement, backdrop color/opacity, outside-click closure, overflow and nested overlays. Pointer hotspots account for transforms and ancestor clipping.

Root frames support horizontal, vertical and two-axis scroll, fixed/sticky descendants, and scroll-to actions. Motion timeline sampling is visible during presentation. Touch events use the pointer interaction path.

## Limits

- In-app Present is local playback. [Prototype files](PROTOTYPE-SHARING.md) add an offline HTML export with an optional password and embed code. Hosted prototype URLs, remote access permissions, remote comments and mobile companion apps are absent.
- The frame sets the viewport. Device choices draw generic shells (phone, foldable, tablet, laptop, desktop, watch) and name no real device; orientation changes the viewport proportions and does not rotate artwork.
- Sticky bounds use the layer box, so a sticky layer that is itself rotated uses conservative bounds.
- Smart animate is an independent implementation. Divergent hierarchies, arbitrary mixed text runs, all paint/effect combinations and nested interactive variants need further acceptance checks. New transitions can interrupt playback, but exact Figma interruption semantics are not claimed.
- Gamepad triggers are tested with simulated browser input; physical controllers and all native input combinations require further testing.
- The expression/action engine enables checkbox, radio, dropdown, progress and cart simulations through authored variables and variants; a dedicated form-control library and text input simulation remain absent.
- Connection search matches top-level destination actions. Nested conditions are validated for missing targets, but their destination labels are not all indexed in search.

## Figma bridge evidence

The bridge transfers supported mouse/delay navigation, back, URL, close, overlay and scroll actions, standard/cubic transitions, layout guides and page ruler guides. Other triggers, variables/conditions/variant behavior, flow metadata, overlay appearance and fixed/sticky behavior have explicit omission reports.

A synthetic real connected-API check on October 29, 2026 preserved a five-node composition with three stretch columns, margin and gutter, a vertical-scrolling frame, click navigation with a 300 ms dissolve, centered text and a diagonal editable vector. A separate read confirmed persistence. The runtime rejected optional layout-grid fields accepted by the published generic typing; the bridge now emits only the fields allowed by each alignment. The sanitized return is in tests/fixtures/bridge-prototype-roundtrip.json. This harness reused an existing synthetic page because page removal was unavailable through the connection; it did not exercise the installed desktop plugin UI. A screenshot request then hit the connected service's Starter-plan call limit. No user reference file contents or identifiers are included in that fixture.

## Nested scroll regions

A frame, component or instance inside the presented frame scrolls independently when its Scroll overflow is set, in ordinary presentation and in overlays. Content moves inside the region, which always clips while presented. The wheel and trackpad reach the innermost region under the pointer that has room, then pass outward; dragging scrolls unless a layer on the path has a drag interaction; Arrow Up/Down, Page Up/Down, Home and End scroll the region last under the pointer. Left and Right still change frames.

Fixed layers stay in the region and sticky layers hold until their parent ends, including inside rotated parents. Scroll-to reaches a layer through every enclosing region over the authored duration and easing. A region fires its own While scrolling interactions. Navigation resets the destination frame's regions unless the action preserves scroll, and Restart resets all of them.

Regions have no visible scrollbars, because they scroll artwork rather than a native element. Motion preview keeps its own frame-level scroller and does not support nested regions. Exported prototypes are not covered here. Validation: `tests/prototype-nested-scroll.test.ts`, `tests/e2e/prototype-nested-scroll.spec.ts`, `tests/e2e/prototype-device-shell.spec.ts`.
